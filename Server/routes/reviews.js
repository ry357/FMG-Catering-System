import express from 'express';
import { queryOne, query, executeWithId } from '../config/dbHelper.js';
import { authenticateToken, requireCustomer } from '../middleware/auth.js';

const router = express.Router();

// Public: approved testimonials for the customer-facing reviews page.
router.get('/', async (req, res) => {
  try {
    const reviews = await query(
      `SELECT id, name, event_type, rating, quote, created_at
       FROM Reviews
       WHERE status = 'approved'
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to load reviews' });
  }
});

// Customer-only: submit a new testimonial.
router.post('/', authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { rating, quote, event_type } = req.body;
    const customerId = req.user.id;

    const parsedRating = Number(rating);
    if (!quote || !String(quote).trim()) {
      return res.status(400).json({ success: false, error: 'Review message is required' });
    }
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const customer = await queryOne('SELECT id, name, email FROM Customers WHERE id = ?', [customerId]);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    const reviewId = await executeWithId(
      `INSERT INTO Reviews (customer_id, name, event_type, rating, quote, status)
       VALUES (?, ?, ?, ?, ?, 'approved')`,
      [customerId, customer.name, String(event_type || '').trim() || null, parsedRating, String(quote).trim()]
    );

    const review = await queryOne(
      'SELECT id, name, event_type, rating, quote, created_at FROM Reviews WHERE id = ?',
      [reviewId]
    );

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});

export default router;