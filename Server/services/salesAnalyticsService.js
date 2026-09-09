// Sales & booking analytics for the premium admin dashboard.
// All figures are computed from live records (Sales/Bookings/Customers) and the
// rule-based cost model — no hardcoded sample sales data.
import { query } from '../config/dbHelper.js';
import { estimateFoodCost, estimateInvoice } from './costModel.js';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const monthKey = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key) => {
  if (!key) return key;
  const [, month] = key.split('-');
  return MONTH_LABELS[Number(month) - 1] || key;
};

const addDays = (date, amount) => {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + amount);
  return d;
};

const toDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const pctChange = (current, previous) => {
  if (!previous || previous <= 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const decorateBooking = (row) => {
  const invoice = estimateInvoice(row);
  const foodCost = estimateFoodCost(row);
  return {
    ...row,
    guests: Number(row.number_of_guests || 0),
    paid: Number(row.paid || 0),
    invoiceValue: invoice,
    foodCost,
  };
};

export const getSalesDashboard = async (days) => {
  const raw = Number(days);
  const isAllTime = Number.isFinite(raw) && raw === 0;
  const rangeDays = isAllTime
    ? 7300 // effectively unlimited: ~20 years of event dates
    : Math.max(1, Math.min(Number.isFinite(raw) ? raw || 90 : 90, 730));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = addDays(today, rangeDays);
  const prevEnd = new Date(today.getTime());
  const prevStart = addDays(today, -rangeDays);

  const startStr = toDateString(today);
  const endStr = toDateString(end);
  const prevStartStr = toDateString(prevStart);
  const prevEndStr = toDateString(prevEnd);

  const rows = await query(`
    SELECT
      b.id AS booking_id,
      b.booking_ref,
      b.event_type,
      b.event_date,
      b.number_of_guests,
      b.budget,
      b.preferred_package,
      b.total_amount,
      b.status,
      b.payment_status,
      c.name AS customer_name,
      COALESCE(SUM(CASE WHEN s.payment_status = 'completed' THEN s.amount ELSE 0 END), 0) AS paid
    FROM Bookings b
    JOIN Customers c ON c.id = b.customer_id
    LEFT JOIN Sales s ON s.booking_id = b.id
    GROUP BY b.id
  `);

  const bookings = rows.map(decorateBooking);
  const inWindow = (b) => b.event_date >= startStr && b.event_date <= endStr;
  const inPrev = (b) => b.event_date >= prevStartStr && b.event_date <= prevEndStr;
  const finalized = (b) => b.status === 'approved' || b.status === 'completed';

  const current = bookings.filter((b) => inWindow(b) && finalized(b));
  const previous = bookings.filter((b) => inPrev(b) && finalized(b));
  const upcoming = bookings.filter(
    (b) => b.event_date >= startStr && b.event_date <= endStr && (b.status === 'pending' || b.status === 'approved')
  );

  const summarize = (list) => {
    const sum = (pick) => list.reduce((acc, b) => acc + pick(b), 0);
    const totalRevenue = sum((b) => b.paid);
    const invoiceTotal = sum((b) => b.invoiceValue);
    const foodCostTotal = sum((b) => b.foodCost);
    return {
      totalBookedEvents: list.length,
      totalRevenue,
      invoiceTotal,
      foodCostTotal,
      avgEventValue: list.length ? Number((totalRevenue / list.length).toFixed(2)) : 0,
      cogsPercent: invoiceTotal ? Number(((foodCostTotal / invoiceTotal) * 100).toFixed(1)) : null,
    };
  };

  const cur = summarize(current);
  const prev = summarize(previous);

  const kpis = {
    totalRevenue: Number(cur.totalRevenue.toFixed(2)),
    avgEventValue: cur.avgEventValue,
    cogsPercent: cur.cogsPercent,
    totalBookedEvents: cur.totalBookedEvents,
    trends: {
      totalRevenue: pctChange(cur.totalRevenue, prev.totalRevenue),
      avgEventValue: pctChange(cur.avgEventValue, prev.avgEventValue),
      totalBookedEvents: pctChange(cur.totalBookedEvents, prev.totalBookedEvents),
      cogsPercent: cur.cogsPercent !== null && prev.cogsPercent !== null
        ? Number((cur.cogsPercent - prev.cogsPercent).toFixed(1))
        : null,
    },
  };

  const nowMonth = new Date();
  const monthlyMap = {};
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(nowMonth.getFullYear(), nowMonth.getMonth() - i, 1);
    monthlyMap[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] =
      { month: 0, revenue: 0, foodCost: 0, events: 0 };
  }

  bookings
    .filter((b) => b.event_date)
    .forEach((b) => {
      const key = monthKey(b.event_date);
      if (!key || !monthlyMap[key]) return;
      monthlyMap[key].revenue += b.paid;
      monthlyMap[key].foodCost += finalized(b) ? b.foodCost : 0;
      monthlyMap[key].events += finalized(b) ? 1 : 0;
    });

  const monthly = Object.entries(monthlyMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({
      month: key,
      label: monthLabel(key),
      revenue: Number(value.revenue.toFixed(2)),
      foodCost: Number(value.foodCost.toFixed(2)),
      events: value.events,
    }));

  const stages = [
    { key: 'pending', label: 'Inquiries', count: 0 },
    { key: 'approved', label: 'Confirmed', count: 0 },
    { key: 'completed', label: 'Closed Won', count: 0 },
  ];
  upcoming.forEach((b) => {
    const stage = stages.find((s) => s.key === b.status);
    if (stage) stage.count += 1;
  });
  const pipeline = stages.map((s) => ({ ...s, count: Number(s.count) }));

  const upcomingEvents = upcoming
    .sort((a, b) => b.invoiceValue - a.invoiceValue)
    .slice(0, 8)
    .map((b) => ({
      bookingId: b.booking_id,
      bookingRef: b.booking_ref,
      eventDate: b.event_date,
      customerName: b.customer_name,
      eventType: b.event_type || 'General',
      guests: b.guests,
      invoiceValue: Number(b.invoiceValue.toFixed(2)),
      paid: Number(b.paid.toFixed(2)),
      paymentStatus: b.payment_status || 'pending',
    }));

  return {
    range: {
      days: rangeDays,
      start: startStr,
      end: endStr,
      label: isAllTime ? 'All Time' : `Next ${rangeDays} Days`,
    },
    kpis,
    monthly,
    pipeline,
    upcomingEvents,
    totals: {
      invoiceTotal: Number(cur.invoiceTotal.toFixed(2)),
      foodCostTotal: Number(cur.foodCostTotal.toFixed(2)),
    },
  };
};