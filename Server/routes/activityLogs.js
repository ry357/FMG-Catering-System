import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getActivityLogs } from '../services/activityLogService.js';

const router = express.Router();

// GET /api/activity-logs — admin only, supports ?page, ?limit, ?category, ?search
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? '1',  10) || 1);
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));
    const category = (req.query.category ?? '').trim();
    const search   = (req.query.search   ?? '').trim();

    const result = await getActivityLogs({ page, limit, category, search });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Activity logs fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

export default router;
