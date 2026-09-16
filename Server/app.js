import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/payments.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import salesRoutes from './routes/sales.js';
import userRoutes from './routes/users.js';
import googleAuthRoutes from './routes/googleAuth.js';
import contentRoutes from './routes/content.js';
import recommendationRoutes from './routes/recommendations.js';
import analyticsRoutes from './routes/analytics.js';
import reportRoutes from './routes/reports.js';
import emailRoutes from './routes/emailRoutes.js';
import { generalLimiter, authLimiter, paymentLimiter, bookingLimiter } from './middleware/rateLimiter.js';
import { generateMonthlyReport } from './services/monthlyReportService.js';
import { isGoogleDocsConfigured, autoUploadMonthlyReport } from './services/googleDocsService.js';

const app = express();

app.set('trust proxy', 1);

const corsOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Enhanced CORS configuration
const corsOptions = {
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    gcash: Boolean(process.env.PAYMONGO_SECRET_KEY),
  });
});

app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/google-auth', googleAuthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api', contentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);

// Monthly report trigger for Vercel Cron (replaces the local setInterval job).
// Generates the summary report for the previous, now-completed month.
app.post('/api/cron/monthly-report', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    const now = new Date();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const result = await generateMonthlyReport({ year, month, generatedBy: null });

    // Auto-upload the Word version to Google Docs and share with the admin.
    if (isGoogleDocsConfigured()) {
      try {
        await autoUploadMonthlyReport({
          id: result.reportId,
          file_path: result.filename,
          report_date: result.summary.end,
        });
      } catch (uploadError) {
        console.error('[monthly-report-cron] Google Docs upload failed:', uploadError.message);
      }
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[monthly-report-cron] Failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate report' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

export default app;