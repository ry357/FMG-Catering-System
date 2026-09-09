import express from 'express';
import { query } from '../config/dbHelper.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { getSalesDashboard } from '../services/salesAnalyticsService.js';
import { PACKAGES, MENU_CATALOG } from '../data/catalog.js';

const router = express.Router();

const monthKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const FOOD_NAMES = new Set(MENU_CATALOG.foods);
const SIDE_NAMES = new Set(MENU_CATALOG.sides);
const DRINK_NAMES = new Set(MENU_CATALOG.drinks);

// Extract dish names from a booking's additional_requests field, which stores
// either `MENU: <array>` (selected_menu_items) or `MENU PREFERENCE: <object>`
// (menuPreference with selections.mains/sides/desserts).
const extractMenuNames = (additionalRequests) => {
  const names = [];
  if (!additionalRequests) return names;

  for (const marker of ['MENU PREFERENCE:', 'MENU:']) {
    const markerIndex = additionalRequests.indexOf(marker);
    if (markerIndex === -1) continue;
    const raw = additionalRequests.slice(markerIndex + marker.length).trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === 'object' && item.name) {
            names.push(String(item.name));
          }
        });
      } else if (parsed && typeof parsed === 'object' && parsed.selections) {
        ['mains', 'sides', 'desserts'].forEach((key) => {
          (parsed.selections[key] || []).forEach((dish) => {
            if (dish) names.push(String(dish));
          });
        });
      }
    } catch {
      // Unparsable blob — ignore
    }
  }
  return names;
};

// Dashboard summary (admin only)
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [revenueRow] = await query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM Sales WHERE payment_status = 'completed'"
    );
    const [bookingRow] = await query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as approved,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected
      FROM Bookings
    `);
    const [customerRow] = await query('SELECT COUNT(*) as total FROM Customers');
    const [saleRow] = await query(
      "SELECT COUNT(*) as total FROM Sales WHERE payment_status = 'completed'"
    );

    res.json({
      success: true,
      data: {
        totalRevenue: Number(revenueRow?.total || 0),
        totalBookings: Number(bookingRow?.total || 0),
        pendingBookings: Number(bookingRow?.pending || 0),
        approvedBookings: Number(bookingRow?.approved || 0),
        completedBookings: Number(bookingRow?.completed || 0),
        rejectedBookings: Number(bookingRow?.rejected || 0),
        totalCustomers: Number(customerRow?.total || 0),
        totalSales: Number(saleRow?.total || 0),
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics overview' });
  }
});

// Most booked packages (admin only)
router.get('/packages', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT preferred_package, COUNT(*) as bookings_count
      FROM Bookings
      WHERE status IN ('approved', 'completed') AND preferred_package IS NOT NULL AND preferred_package != ''
      GROUP BY preferred_package
      ORDER BY bookings_count DESC
    `);

    const data = rows.map((row) => {
      const pkg = PACKAGES.find((p) => String(p.id) === String(row.preferred_package));
      return {
        packageId: row.preferred_package,
        packageName: pkg ? pkg.name : 'Custom / Not set',
        bookingsCount: Number(row.bookings_count),
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics packages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch package analytics' });
  }
});

// Most popular services (by event type) (admin only)
router.get('/services', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT event_type, COUNT(*) as bookings_count
      FROM Bookings
      GROUP BY event_type
      ORDER BY bookings_count DESC
    `);

    const data = rows.map((row) => ({
      service: row.event_type || 'General',
      bookingsCount: Number(row.bookings_count),
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics services error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service analytics' });
  }
});

// Monthly revenue trends (admin only)
router.get('/revenue', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const sales = await query(
      "SELECT amount, sale_date FROM Sales WHERE payment_status = 'completed'"
    );

    const byMonth = {};
    for (const sale of sales) {
      const key = monthKey(sale.sale_date);
      byMonth[key] = (byMonth[key] || 0) + Number(sale.amount || 0);
    }

    const data = Object.entries(byMonth)
      .map(([month, revenue]) => ({ month, revenue: Number(revenue.toFixed(2)) }))
      .filter((item) => item.month !== 'unknown')
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics revenue error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch revenue analytics' });
  }
});

// Peak and low-demand booking periods (admin only)
router.get('/booking-periods', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT event_date FROM Bookings WHERE event_date IS NOT NULL');

    const byMonth = {};
    for (const row of rows) {
      const key = monthKey(row.event_date);
      if (key === 'unknown') continue;
      byMonth[key] = (byMonth[key] || 0) + 1;
    }

    const byMonthEntries = Object.entries(byMonth)
      .map(([month, bookingsCount]) => ({ month, bookingsCount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        byMonth: byMonthEntries,
        peakPeriods: [...byMonthEntries].sort((a, b) => b.bookingsCount - a.bookingsCount).slice(0, 5),
        lowDemandPeriods: [...byMonthEntries].sort((a, b) => a.bookingsCount - b.bookingsCount).slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Analytics booking periods error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking period analytics' });
  }
});

// Least popular items — packages, foods, side dishes, and drinks ranked ascending
router.get('/least-popular', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const pkgRows = await query(`
      SELECT preferred_package, COUNT(*) as bookings_count
      FROM Bookings
      WHERE status IN ('approved', 'completed') AND preferred_package IS NOT NULL AND preferred_package != ''
      GROUP BY preferred_package
    `);

    const pkgCount = {};
    for (const row of pkgRows) {
      pkgCount[String(row.preferred_package)] = Number(row.bookings_count);
    }

    const packages = PACKAGES
      .map((pkg) => ({
        packageName: pkg.name,
        bookingsCount: pkgCount[String(pkg.id)] || 0,
      }))
      .sort((a, b) => a.bookingsCount - b.bookingsCount);

    const menuRows = await query(`
      SELECT additional_requests FROM Bookings
      WHERE status IN ('approved', 'completed')
    `);

    const counts = { foods: {}, sides: {}, drinks: {} };
    for (const row of menuRows) {
      for (const name of extractMenuNames(row.additional_requests)) {
        if (FOOD_NAMES.has(name)) counts.foods[name] = (counts.foods[name] || 0) + 1;
        else if (SIDE_NAMES.has(name)) counts.sides[name] = (counts.sides[name] || 0) + 1;
        else if (DRINK_NAMES.has(name)) counts.drinks[name] = (counts.drinks[name] || 0) + 1;
      }
    }

    const toLeastPopularList = (catalog, countMap, limit = 5) =>
      catalog
        .map((name) => ({ name, bookingsCount: countMap[name] || 0 }))
        .sort((a, b) => a.bookingsCount - b.bookingsCount)
        .slice(0, limit);

    res.json({
      success: true,
      data: {
        packages,
        foods: toLeastPopularList(MENU_CATALOG.foods, counts.foods),
        sides: toLeastPopularList(MENU_CATALOG.sides, counts.sides),
        drinks: toLeastPopularList(MENU_CATALOG.drinks, counts.drinks),
      },
    });
  } catch (error) {
    console.error('Analytics least-popular error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch least popular items' });
  }
});

// Premium sales analytics dashboard — KPIs, monthly revenue vs costs,
// booking pipeline, and upcoming high-value events (admin only)
router.get('/sales-dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const data = await getSalesDashboard({ month: req.query.month });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics sales-dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales dashboard' });
  }
});

export default router;