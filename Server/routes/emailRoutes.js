import express from 'express';
import { query } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  getEmailSettings,
  applyEmailSettings,
  sendPromotionalEmail,
} from '../services/emailService.js';

const router = express.Router();

// Get email/SMTP configuration (admin only)
router.get('/settings', authenticateToken, requireRole(['admin']), (_req, res) => {
  res.json({ success: true, data: getEmailSettings() });
});

// Update email/SMTP configuration (admin only)
router.put('/settings', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { host, port, user, pass, from } = req.body || {};

    if ([host, port, user, pass, from].every((v) => v === undefined)) {
      return res.status(400).json({ success: false, error: 'No settings provided to update' });
    }

    applyEmailSettings({ host, port, user, pass, from });

    res.json({ success: true, data: getEmailSettings() });
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update email settings' });
  }
});

// Send promotional campaign (admin only)
router.post('/campaign', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { subject, message, recipientEmails } = req.body || {};

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'subject and message are required' });
    }

    let recipients = [];
    if (Array.isArray(recipientEmails) && recipientEmails.length) {
      recipients = [...new Set(recipientEmails.map((email) => String(email).trim()).filter(Boolean))];
    } else {
      const rows = await query(
        'SELECT DISTINCT email FROM Customers WHERE email IS NOT NULL AND email != ?',
        ['']
      );
      recipients = rows.map((row) => row.email);
    }

    if (!recipients.length) {
      return res.status(400).json({ success: false, error: 'No recipients found' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #C9A227 0%, #D4AF37 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">FMG Catering</h1>
          <p style="margin: 4px 0 0;">Creating Unforgettable Celebrations</p>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <p style="white-space: pre-line;">${message}</p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px;">
          <p>FMG Catering | Cebu, Philippines</p>
          <p>Email: bookings@fmgcatering.com | Phone: +63 32 123 4567</p>
        </div>
      </div>
    `;

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const email of recipients) {
      const result = await sendPromotionalEmail(subject, html, email);
      if (result.success) {
        sentCount += 1;
      } else {
        failedCount += 1;
      }
      results.push({ email, success: result.success, error: result.error || null });
    }

    res.json({ success: true, data: { sentCount, failedCount, recipients: results } });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to send campaign' });
  }
});

export default router;