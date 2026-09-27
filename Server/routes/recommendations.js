import express from 'express';
import { PACKAGES } from '../data/catalog.js';

const router = express.Router();

// Rule-based package recommendations (not ML).
// Filters inactive/unsupported/out-of-range/over-budget packages, then ranks
// the top 3 by fitScore = (estimatedTotal/budget)*0.6 + guestCapacityMatch*0.4
router.post('/', async (req, res) => {
  try {
    const { eventType, guests, budget } = req.body;

    if (!eventType || !guests || !budget) {
      return res.status(400).json({ success: false, error: 'eventType, guests, and budget are required.' });
    }

    const guestCount = Number(guests);
    const totalBudget = Number(budget);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({ success: false, error: 'guests must be a positive integer.' });
    }
    if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
      return res.status(400).json({ success: false, error: 'budget must be a positive number.' });
    }

    const normalizedEventType = String(eventType).toLowerCase();

    const candidates = PACKAGES.map((pkg) => {
      const baseTotal = pkg.pricePerGuest * guestCount;
      const estimatedTotal = Math.max(baseTotal, totalBudget);
      const additionalFoodAllowance = Math.max(0, totalBudget - baseTotal);
      return {
        ...pkg,
        baseTotal,
        estimatedTotal,
        additionalFoodAllowance
      };
    }).filter((pkg) => {
      const supportsEvent = (pkg.eventTypes || []).some((t) => String(t).toLowerCase() === normalizedEventType);
      if (!supportsEvent) return false;
      if (guestCount < pkg.minGuests || guestCount > pkg.maxGuests) return false;
      // We only exclude if their budget is smaller than the base total.
      if (pkg.baseTotal > totalBudget) return false;
      return true;
    });

    const ranked = candidates
      .map((pkg) => {
        const budgetUtilization = pkg.baseTotal / totalBudget;
        const sweetSpot = (pkg.minGuests + pkg.maxGuests) / 2;
        const spread = Math.max(1, pkg.maxGuests - pkg.minGuests);
        const guestCapacityMatch = Math.max(0, 1 - Math.abs(guestCount - sweetSpot) / spread);
        const fitScore = budgetUtilization * 0.6 + guestCapacityMatch * 0.4;
        return { ...pkg, fitScore: Number(fitScore.toFixed(4)) };
      })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3);

    res.json({ success: true, recommendations: ranked });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
  }
});

export default router;