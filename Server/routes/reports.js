import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { PACKAGES } from '../data/catalog.js';
import { generateMonthlyReport, getLatestMonthlyReport } from '../services/monthlyReportService.js';
import {
  isGoogleDocsConfigured,
  getAuthMethod,
  getShareEmail,
  autoUploadMonthlyReport,
  uploadReportToGoogleDocs,
  buildOAuthAuthUrl,
  exchangeOAuthCode,
} from '../services/googleDocsService.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = process.env.VERCEL ? path.join('/tmp', 'reports-output') : path.join(__dirname, '..', 'reports-output');

const REPORT_TYPES = ['daily', 'weekly', 'monthly', 'annual'];

const MIME_BY_EXTENSION = {
  '.csv':  'text/csv',
  '.md':   'text/markdown',
  '.txt':  'text/plain',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function getPeriodBounds(type) {
  const now = new Date();
  let start;
  let end;

  switch (type) {
    case 'daily': {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      break;
    }
    case 'weekly': {
      // Previous Monday–Sunday
      const dow = (now.getDay() + 6) % 7; // Monday = 0
      start = new Date(now);
      start.setDate(now.getDate() - dow - 7);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;
    }
    case 'monthly': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    }
    case 'annual': {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      break;
    }
    default:
      break;
  }

  const fmt = (d) => d.toISOString().split('T')[0];
  return { start: fmt(start), end: fmt(end) };
}

function buildReportCsv(summary) {
  const rows = [
    ['Report Type', summary.type],
    ['Period Start', summary.start],
    ['Period End', summary.end],
    ['Total Bookings', summary.bookingsCount],
    ['Completed Sales', summary.salesCount],
    ['Revenue', summary.revenue.toFixed(2)],
    ['Top Packages', summary.topPackages.map((p) => `${p.packageName} (${p.bookingsCount})`).join('; ')],
    ['Status Breakdown', Object.entries(summary.statusBreakdown).map(([k, v]) => `${k}: ${v}`).join('; ')],
  ];
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

function escapeCsv(value) {
  const str = String(value ?? '');
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Reads a stored report file and uploads it to Google Docs, sharing it with the admin.
async function uploadStoredReportToGoogleDocs(reportId) {
  const report = await queryOne('SELECT * FROM Reports WHERE id = ?', [reportId]);
  if (!report) {
    const error = new Error('Report not found');
    error.code = 'REPORT_NOT_FOUND';
    throw error;
  }
  if (report.report_type !== 'monthly_summary') {
    const error = new Error('Only monthly summary reports can be uploaded as Word documents');
    error.code = 'NOT_MONTHLY_SUMMARY';
    throw error;
  }
  const fileContent = await fs.readFile(path.join(REPORTS_DIR, path.basename(report.file_path)), 'utf8');
  return uploadReportToGoogleDocs(report, fileContent);
}

// Generate a report (staff/admin)
router.post('/generate', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { type } = req.body;
    if (!REPORT_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: `Report type must be one of: ${REPORT_TYPES.join(', ')}` });
    }

    const { start, end } = getPeriodBounds(type);

    const bookings = await query(
      'SELECT * FROM Bookings WHERE event_date >= ? AND event_date <= ?',
      [start, end]
    );
    const sales = await query(
      "SELECT * FROM Sales WHERE sale_date >= ? AND sale_date <= ? AND payment_status = 'completed'",
      [start, end]
    );

    const statusBreakdown = {};
    const packageCounts = {};
    for (const booking of bookings) {
      statusBreakdown[booking.status || 'unknown'] = (statusBreakdown[booking.status || 'unknown'] || 0) + 1;
      const key = booking.preferred_package || 'custom';
      packageCounts[key] = (packageCounts[key] || 0) + 1;
    }

    const topPackages = Object.entries(packageCounts)
      .map(([id, bookingsCount]) => {
        const pkg = PACKAGES.find((p) => String(p.id) === String(id));
        return {
          packageId: id,
          packageName: pkg ? pkg.name : 'Custom / Not set',
          bookingsCount,
        };
      })
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);

    const summary = {
      type,
      start,
      end,
      bookingsCount: bookings.length,
      salesCount: sales.length,
      revenue,
      topPackages,
      statusBreakdown,
    };

    await fs.mkdir(REPORTS_DIR, { recursive: true });
    const filename = `fmg-${type}-${start}_to_${end}.csv`;
    await fs.writeFile(path.join(REPORTS_DIR, filename), buildReportCsv(summary), 'utf8');

    const reportId = await executeWithId(
      'INSERT INTO Reports (report_type, report_date, generated_by, file_path) VALUES (?, ?, ?, ?)',
      [type, end, req.user.id, filename]
    );

    res.json({
      success: true,
      reportId,
      summary,
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Generate (or refresh) the monthly summary report (staff/admin)
router.post('/monthly-summary', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const now = new Date();
    const requestedYear = Number(req.body?.year);
    const requestedMonth = Number(req.body?.month);

    // Default to the previous, now-completed month.
    const year = requestedYear || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const month = requestedMonth || (now.getMonth() === 0 ? 12 : now.getMonth());

    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Month must be between 1 and 12' });
    }

    const result = await generateMonthlyReport({ year, month, generatedBy: req.user.id });

    // Auto-upload a Word version of the report to Google Docs and share with the admin.
    let googleDoc = null;
    if (isGoogleDocsConfigured()) {
      try {
        googleDoc = await autoUploadMonthlyReport({
          id: result.reportId,
          file_path: result.filename,
          report_date: result.summary.end,
        });
      } catch (uploadError) {
        console.error('Auto-upload to Google Docs failed:', uploadError.message);
      }
    }

    res.json({
      success: true,
      reportId: result.reportId,
      refreshed: result.refreshed,
      summary: result.summary,
      docxFilename: result.docxFilename || null,
      googleDoc,
    });
  } catch (error) {
    console.error('Generate monthly summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate monthly summary report' });
  }
});

// Fetch the latest automated monthly summary report (staff/admin)
router.get('/monthly-summary', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const latest = await getLatestMonthlyReport();
    if (!latest) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: latest });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monthly summary report' });
  }
});

// List generated reports (staff/admin)
router.get('/', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const reports = await query(`
      SELECT r.id, r.report_type, r.report_date, r.file_path, r.created_at, u.full_name as generated_by_name
      FROM Reports r
      LEFT JOIN Users u ON r.generated_by = u.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reports });
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// Google Docs integration status (staff/admin)
router.get('/google-docs/config', authenticateToken, requireRole(['staff', 'admin']), (req, res) => {
  const method = getAuthMethod();
  res.json({
    success: true,
    configured: isGoogleDocsConfigured(),
    method,
    shareEmail: isGoogleDocsConfigured() ? getShareEmail() : null,
  });
});

// Generates the Google OAuth authorization URL for the one-time consent flow (staff/admin)
const callbackBaseUrl = (req) => `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;

router.get('/google-docs/auth-url', authenticateToken, requireRole(['staff', 'admin']), (req, res) => {
  if (getAuthMethod() === 'oauth') {
    return res.json({ success: true, message: 'Google Docs is already connected.' });
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
    return res.status(400).json({
      success: false,
      code: 'OAUTH_NOT_CONFIGURED',
      error: 'OAuth client is not configured yet. Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to the server.',
    });
  }
  const redirectUri = `${callbackBaseUrl(req)}/api/reports/google-docs/auth/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  res.json({ success: true, url: buildOAuthAuthUrl(redirectUri, state), state });
});

// OAuth consent callback: exchanges the code for a refresh token the admin stores in Vercel env
router.get('/google-docs/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code. Please start the connection from the Reports tab.');
  }
  const redirectUri = `${callbackBaseUrl(req)}/api/reports/google-docs/auth/callback`;
  try {
    const tokens = await exchangeOAuthCode(code, redirectUri);
    if (!tokens.refresh_token) {
      return res.status(400).send('Google did not return a refresh token (offline access was not granted). Please try again.');
    }
    const shareEmail = getShareEmail();
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>FMG Catering — Connected</title>
      <style>body{font-family:Arial,sans-serif;background:#fafaf5;display:flex;justify-content:center;padding:40px;margin:0}
      .card{background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:28px;max-width:600px;width:100%;box-shadow:0 4px 12px rgba(0,0,0,.08)}
      pre{background:#f5f5f0;padding:12px;border-radius:8px;word-break:break-all;font-size:12px;overflow-wrap:break-word}
      button{background:#b8860b;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:14px;cursor:pointer}</style></head>
      <body><div class="card"><h2>Google Docs connected!</h2>
      <p>Copy this refresh token, then add it in Vercel as <b>GOOGLE_OAUTH_REFRESH_TOKEN</b> for the <b>fmg-catering-server</b> project (Production). Then redeploy the server.</p>
      <pre id="token">${tokens.refresh_token}</pre>
      <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent);this.textContent='Copied!'">Copy token</button>
      <p style="color:#777;font-size:13px">Sharing: monthly summary reports will be saved to your Google Drive and opened as Google Docs. Target email: ${shareEmail}</p>
      <p><a href="${callbackBaseUrl(req)}/api/reports/google-docs/config" style="font-size:13px">Check connected status</a></p>
      </div></body></html>`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`Failed to connect Google Docs: ${error.message}`);
  }
});

// Upload an existing monthly summary report to Google Docs and share it (staff/admin)
router.post('/:id/google-doc', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    res.setTimeout(60 * 1000);
    const googleDoc = await uploadStoredReportToGoogleDocs(req.params.id);
    res.json({ success: true, googleDoc });
  } catch (error) {
    console.error('Upload to Google Docs error:', error.message);
    const status =
      error.code === 'REPORT_NOT_FOUND' ? 404
      : error.code === 'NOT_MONTHLY_SUMMARY' || error.code === 'GOOGLE_NOT_CONFIGURED' ? 400
      : 500;
    res.status(status).json({ success: false, error: error.message, code: error.code || 'GOOGLE_UPLOAD_FAILED' });
  }
});

// Download the Word (.docx) version of a monthly summary report (staff/admin)
router.get('/:id/download-docx', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const report = await queryOne('SELECT * FROM Reports WHERE id = ?', [req.params.id]);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Derive the .docx filename from the stored .md filename
    const baseName = path.basename(report.file_path || '', '.md');
    const docxName = `${baseName}.docx`;
    const absolutePath = path.resolve(REPORTS_DIR, docxName);

    let fileContent;
    try {
      fileContent = await fs.readFile(absolutePath);
    } catch {
      // If the file does not exist on disk (e.g. serverless cold start), regenerate it!
      if (report.report_type === 'monthly_summary' && report.report_date) {
        const [yearStr, monthStr] = String(report.report_date).split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        if (year && month) {
          try {
            await generateMonthlyReport({ year, month, generatedBy: report.generated_by });
            fileContent = await fs.readFile(absolutePath);
          } catch (genErr) {
            console.error('Failed to regenerate report docx on the fly:', genErr);
          }
        }
      }
    }

    if (!fileContent) {
      return res.status(404).json({ success: false, error: 'Word document not found. Please regenerate the report.' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${docxName}"`);
    res.send(fileContent);
  } catch (error) {
    console.error('Download docx error:', error);
    res.status(500).json({ success: false, error: 'Failed to download Word document' });
  }
});

// Download a generated report source file (staff/admin)
router.get('/:id/download', authenticateToken, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const report = await queryOne('SELECT * FROM Reports WHERE id = ?', [req.params.id]);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const absolutePath = path.resolve(REPORTS_DIR, path.basename(report.file_path));
    let fileContent;
    try {
      fileContent = await fs.readFile(absolutePath);
    } catch {
      if (report.report_type === 'monthly_summary' && report.report_date) {
        const [yearStr, monthStr] = String(report.report_date).split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        if (year && month) {
          try {
            await generateMonthlyReport({ year, month, generatedBy: report.generated_by });
            fileContent = await fs.readFile(absolutePath);
          } catch (genErr) {
            console.error('Failed to regenerate report file on the fly:', genErr);
          }
        }
      }
    }

    if (!fileContent) {
      return res.status(404).json({ success: false, error: 'Report file not found' });
    }

    const ext = path.extname(report.file_path).toLowerCase();
    res.setHeader('Content-Type', MIME_BY_EXTENSION[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(report.file_path)}"`);
    res.send(fileContent);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ success: false, error: 'Failed to download report' });
  }
});

export default router;