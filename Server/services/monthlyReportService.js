import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne, execute, executeWithId } from '../config/dbHelper.js';
import { PACKAGES } from '../data/catalog.js';
import { buildWordDocument } from './wordReportService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MONTHLY_REPORTS_DIR = path.join(__dirname, '..', 'reports-output');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toDateString = (date) => date.toISOString().split('T')[0];

const toLocalDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount || 0));

const formatNumber = (value, fractionDigits = 0) => {
  if (value === null || value === undefined || value === 'N/A') return 'N/A';
  const n = Number(value);
  if (!Number.isFinite(n)) return 'N/A';
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(n);
};

const titleCase = (str) =>
  String(str || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const formatDateISO = (iso) => {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatISODate = (iso) => (iso ? String(iso).slice(0, 10) : 'N/A');

// Maps database booking statuses to the report's business vocabulary.
const bookingStatusLabel = (status) => {
  const map = { pending: 'Pending', approved: 'Approved', rejected: 'Cancelled', completed: 'Completed' };
  return map[String(status || '')] || titleCase(status);
};

async function collectMonthData(year, month) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  const start = toDateString(startDate);
  // Exclusive upper bound (first day of next month) so timestamp columns
  // (created_at, sale_date) and DATE columns (event_date) both match cleanly.
  const endExclusive = toDateString(new Date(Date.UTC(year, month, 1)));

  const [sales, bookings, customersInMonth, newCustomers, prevBookings, allCustomers, allBookings, emailLogs] = await Promise.all([
    query(
      "SELECT id, booking_id, amount, payment_status, sale_date FROM Sales WHERE payment_status = 'completed' AND sale_date >= ? AND sale_date < ?",
      [start, endExclusive]
    ),
    query(
      `SELECT b.id, b.customer_id, b.event_type, b.event_date, b.number_of_guests, b.budget, b.preferred_package,
              b.status, b.booking_ref, b.payment_type, b.down_payment_amount, b.total_amount, b.payment_status, b.created_at,
              c.name AS customer_name, c.email AS customer_email
       FROM Bookings b
       JOIN Customers c ON b.customer_id = c.id
       WHERE b.event_date >= ? AND b.event_date < ?`,
      [start, endExclusive]
    ),
    query('SELECT customer_id FROM Bookings WHERE event_date >= ? AND event_date < ?', [start, endExclusive]),
    query('SELECT id FROM Customers WHERE created_at >= ? AND created_at < ?', [start, endExclusive]),
    query('SELECT id, event_date FROM Bookings WHERE event_date < ?', [start]),
    query('SELECT id, name, email FROM Customers'),
    query('SELECT id, customer_id, event_type, event_date FROM Bookings ORDER BY event_date DESC'),
    query("SELECT recipient_email, email_type, sent_at FROM EmailLogs WHERE email_type IN ('promotional', 'anniversary_reminder')"),
  ]);

  // --- Booking amount resolution ---
  const salesByBooking = {};
  for (const sale of sales) {
    if (!salesByBooking[sale.booking_id]) salesByBooking[sale.booking_id] = 0;
    salesByBooking[sale.booking_id] += Number(sale.amount || 0);
  }
  const bookingAmount = (booking) => {
    if (booking.total_amount != null && Number(booking.total_amount) > 0) return Number(booking.total_amount);
    if (salesByBooking[booking.id]) return salesByBooking[booking.id];
    if (booking.budget != null && Number(booking.budget) > 0) return Number(booking.budget);
    return 0;
  };

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const completedCount = completedBookings.length;
  const cancelledCount = bookings.filter((b) => b.status === 'rejected').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'approved').length;
  const bookingsWithAmount = bookings.map((b) => ({ ...b, amount: bookingAmount(b) }));
  const averagePerBooking = completedCount > 0 ? revenue / completedCount : (bookings.length > 0 ? revenue / bookings.length : null);

  // --- Highest sales day (based on completed sales by day) ---
  const salesByDay = {};
  for (const sale of sales) {
    const day = String(sale.sale_date).slice(0, 10);
    salesByDay[day] = (salesByDay[day] || 0) + Number(sale.amount || 0);
  }
  let highestSalesDay = null;
  let highestSalesValue = 0;
  for (const [day, total] of Object.entries(salesByDay)) {
    if (total > highestSalesValue) {
      highestSalesValue = total;
      highestSalesDay = day;
    }
  }

  // --- Package / service popularity by bookings ---
  const packageCounts = {};
  const serviceCounts = {};
  for (const b of bookings) {
    const pkgKey = b.preferred_package || 'Not specified';
    packageCounts[pkgKey] = (packageCounts[pkgKey] || 0) + 1;
    const svcKey = b.event_type || 'General';
    serviceCounts[svcKey] = (serviceCounts[svcKey] || 0) + 1;
  }
  const packageBookingStats = PACKAGES.map((pkg) => ({
    name: pkg.name,
    bookingsCount: packageCounts[String(pkg.id)] || 0,
  })).sort((a, b) => b.bookingsCount - a.bookingsCount);

  const serviceBookingStats = Object.entries(serviceCounts)
    .map(([service, bookingsCount]) => ({ name: service, bookingsCount }))
    .sort((a, b) => b.bookingsCount - a.bookingsCount);

  const mostBookedPackage = packageBookingStats.find((p) => p.bookingsCount > 0) || null;
  const mostBookedService = serviceBookingStats[0] || null;

  // --- Revenue attribution by service / package ---
  const revenueByPackage = {};
  const revenueByService = {};
  let packageRevenueTotal = 0;
  let serviceRevenueTotal = 0;
  for (const b of bookingsWithAmount) {
    const pkgKey = b.preferred_package || 'Not specified';
    revenueByPackage[pkgKey] = (revenueByPackage[pkgKey] || 0) + b.amount;
    packageRevenueTotal += b.amount;
    const svcKey = b.event_type || 'General';
    revenueByService[svcKey] = (revenueByService[svcKey] || 0) + b.amount;
    serviceRevenueTotal += b.amount;
  }

  const packagePerformance = PACKAGES.map((pkg) => {
    const key = String(pkg.id);
    const bookingsCount = packageCounts[key] || 0;
    const totalSales = revenueByPackage[key] || 0;
    return {
      name: pkg.name,
      bookingsCount,
      totalSales,
      percentage: packageRevenueTotal > 0 ? (totalSales / packageRevenueTotal) * 100 : 0,
      classification: classifyPerformance(bookingsCount, totalSales, packageRevenueTotal),
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const servicePerformance = Object.entries(revenueByService)
    .map(([service, totalSales]) => ({
      name: service,
      bookingsCount: serviceCounts[service] || 0,
      totalSales,
      percentage: serviceRevenueTotal > 0 ? (totalSales / serviceRevenueTotal) * 100 : 0,
      classification: classifyPerformance(serviceCounts[service] || 0, totalSales, serviceRevenueTotal),
    }))
    .sort((a, b) => b.totalSales - a.totalSales);

  // --- Weekly performance (weeks based on event date) ---
  const weekOfMonth = (eventDate) => {
    const day = Number(String(eventDate).slice(8, 10));
    return Math.min(5, Math.floor((day - 1) / 7) + 1);
  };
  const revenueByBooking = {};
  for (const b of bookings) revenueByBooking[b.id] = bookingAmount(b);
  const weekly = {};
  for (let w = 1; w <= 5; w += 1) weekly[w] = { week: w, bookingsCount: 0, totalSales: 0 };
  for (const b of bookings) {
    const w = weekOfMonth(b.event_date);
    weekly[w].bookingsCount += 1;
    weekly[w].totalSales += revenueByBooking[b.id] || 0;
  }
  const weeklyPerformance = Object.values(weekly).map((w) => ({
    ...w,
    average: w.bookingsCount > 0 ? w.totalSales / w.bookingsCount : null,
  }));
  const weeklyTotalSales = Object.values(weekly).reduce((sum, w) => sum + w.totalSales, 0);
  const monthTotal = {
    week: 'Monthly Total',
    bookingsCount: bookings.length,
    totalSales: weeklyTotalSales,
    average: bookings.length > 0 ? weeklyTotalSales / bookings.length : null,
  };

  // --- Transaction details ---
  const transactions = bookingsWithAmount
    .sort((a, b) => (a.event_date < b.event_date ? -1 : 1))
    .map((b) => ({
      bookingRef: b.booking_ref || `FMG-${String(b.id).padStart(5, '0')}`,
      customerName: b.customer_name || 'Walk-in Client',
      eventDate: formatISODate(b.event_date),
      eventType: b.event_type || 'General',
      servicePackage: b.preferred_package || 'Not specified',
      guests: b.number_of_guests ?? 'N/A',
      amount: b.amount || 0,
      status: bookingStatusLabel(b.status),
      dateRecorded: formatISODate(b.created_at),
    }));

  // --- Customer insights ---
  const customerIdsInMonth = new Set(customersInMonth.map((c) => c.customer_id));
  const newCustomerIds = new Set(newCustomers.map((c) => c.id));
  const returningCustomerIds = new Set(prevBookings.map((b) => b.customer_id));
  let newCustomerCount = 0;
  let returningCustomerCount = 0;
  customerIdsInMonth.forEach((cid) => {
    if (newCustomerIds.has(cid) || !returningCustomerIds.has(cid)) newCustomerCount += 1;
    if (returningCustomerIds.has(cid)) returningCustomerCount += 1;
  });

  const bookingPeriodHour = {};
  for (const b of bookings) {
    const h = new Date(`${String(b.created_at).slice(0, 10)}T${String(b.created_at).slice(11, 13) || '00'}:00:00`).getHours();
    const bucket = h >= 18 ? 'Evening' : h >= 12 ? 'Afternoon' : h >= 6 ? 'Morning' : 'Night';
    bookingPeriodHour[bucket] = (bookingPeriodHour[bucket] || 0) + 1;
  }
  const mostCommonBookingPeriod = Object.entries(bookingPeriodHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const insights = {
    totalCustomers: customerIdsInMonth.size > 0 ? customerIdsInMonth.size : 'N/A',
    newCustomers: customerIdsInMonth.size > 0 ? newCustomerCount : 'N/A',
    returningCustomers: customerIdsInMonth.size > 0 ? returningCustomerCount : 'N/A',
    mostCommonEventType: mostBookedService ? mostBookedService.name : 'N/A',
    mostRequestedPackage: mostBookedPackage ? mostBookedPackage.name : 'N/A',
    mostCommonBookingPeriod,
  };

  // --- Promotional opportunities (upcoming recurring events, ~1 month ahead) ---
  const promotions = buildPromotionalOpportunities(allCustomers, allBookings, emailLogs);

  return {
    year,
    month,
    start,
    end: toDateString(new Date(Date.UTC(year, month, 0))),
    monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
    revenue,
    salesCount: sales.length,
    bookingsCount: bookings.length,
    completedCount,
    cancelledCount,
    pendingCount,
    approvedCount,
    averagePerBooking,
    highestSalesDay,
    highestSalesValue,
    mostBookedPackage,
    mostBookedService,
    packageBookingStats,
    serviceBookingStats,
    packagePerformance,
    servicePerformance,
    weeklyPerformance,
    monthTotal,
    transactions,
    insights,
    promotions,
  };
}

// Rule-based performance classification used in Section 4.
function classifyPerformance(bookingsCount, totalSales, totalRevenue) {
  if (bookingsCount === 0) return 'No bookings';
  if (totalRevenue <= 0) return 'No sales';
  const share = (totalSales / totalRevenue) * 100;
  if (share >= 30) return 'High Performing';
  if (share >= 10) return 'Moderate Performing';
  return 'Low Performing';
}

// Rule-based promotional opportunities: recurring event anniversaries falling
// roughly one month (24–40 days) ahead of today.
function buildPromotionalOpportunities(customers, bookings, emailLogs) {
  const now = new Date();
  const customerName = new Map(customers.map((c) => [c.id, c.name]));
  const customerEmail = new Map(customers.map((c) => [c.id, c.email]));
  const emailSentDates = [];
  for (const log of emailLogs) emailSentDates.push({ email: log.recipient_email, date: String(log.sent_at).slice(0, 10) });

  const seen = new Set();
  const opportunities = [];

  const addDaysISO = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const nextOccurrence = (monthDay, year) => {
    const candidate = new Date(Date.UTC(year, monthDay.month - 1, monthDay.day));
    candidate.setHours(12);
    return candidate;
  };

  for (const booking of bookings) {
    if (!booking.event_date) continue;
    const ed = new Date(`${String(booking.event_date).slice(0, 10)}T12:00:00`);
    if (Number.isNaN(ed.getTime())) continue;
    const monthDay = { month: ed.getMonth() + 1, day: ed.getDate() };
    const key = `${booking.customer_id}|${booking.event_type}`;
    if (seen.has(key)) continue; // one row per customer/event
    seen.add(key);

    const currentYearOccurrence = nextOccurrence(monthDay, now.getFullYear());
    const occurrence = currentYearOccurrence.getTime() > now.getTime()
      ? currentYearOccurrence
      : nextOccurrence(monthDay, now.getFullYear() + 1);

    const daysUntil = Math.round((occurrence - now) / 86400000);
    if (daysUntil < 24 || daysUntil > 40) continue;

    const recommendedSend = addDaysISO(occurrence, -30);
    const recommendedSendISO = toDateString(recommendedSend);
    const email = customerEmail.get(booking.customer_id);
    const alreadySent = emailSentDates.some((e) => e.email === email && e.date >= recommendedSendISO);
    opportunities.push({
      customerName: customerName.get(booking.customer_id) || '—',
      occasionDate: `${toDateString(occurrence)} (${titleCase(booking.event_type)} Anniversary)`,
      eventType: booking.event_type || 'General',
      eligibility: 'Eligible',
      recommendedSend: recommendedSendISO,
      status: alreadySent ? 'Email sent' : 'Ready to send',
    });
  }

  opportunities.sort((a, b) => (a.recommendedSend < b.recommendedSend ? -1 : 1));
  return opportunities;
}

const changePercent = (current, previous) => {
  if (previous === null || previous === undefined) return null;
  if (Number(previous) === 0) return current > 0 ? 100 : 0;
  return ((Number(current) - Number(previous)) / Number(previous)) * 100;
};

const describeChange = (percent) => {
  if (percent === null || percent === undefined) return 'could not be measured quantitatively';
  if (Math.abs(percent) < 0.5) return 'showed no measurable change';
  return `${percent >= 0 ? 'increased' : 'decreased'} by ${Math.abs(percent).toFixed(1)}%`;
};

const formatChangeSentence = (percent) => {
  if (percent === null || percent === undefined) return null;
  if (Math.abs(percent) < 0.5) return 'effectively unchanged compared to the previous month';
  return `${percent > 0 ? 'higher' : 'lower'} by ${Math.abs(percent).toFixed(1)}% compared to the previous month`;
};

// ---- Section builders ------------------------------------------------------

function buildReportHeader(metrics, meta) {
  const lines = [];
  lines.push('# FMG Catering Services — Monthly Sales Report');
  lines.push('');
  lines.push(`**Report ID:** ${meta.reportId}`);
  lines.push(`**Reporting Period:** ${metrics.monthLabel}`);
  lines.push(`**Date Generated:** ${formatDateISO(meta.generatedAt)}`);
  lines.push(`**Generated By:** ${meta.generatedByName}`);
  lines.push('');
  return lines;
}

function buildSection1Summary(metrics) {
  const rows = [
    ['Total Sales / Revenue', formatCurrency(metrics.revenue)],
    ['Total Completed Bookings', formatNumber(metrics.completedCount)],
    ['Total Cancelled Bookings', formatNumber(metrics.cancelledCount)],
    ['Total Pending Bookings', formatNumber(metrics.pendingCount)],
    ['Average Sales per Booking', metrics.averagePerBooking === null ? 'N/A' : formatCurrency(metrics.averagePerBooking)],
    ['Highest Sales Day', metrics.highestSalesDay ? formatDateISO(metrics.highestSalesDay) : 'N/A'],
    ['Highest-Selling Service/Package', metrics.mostBookedPackage ? metrics.mostBookedPackage.name : 'N/A'],
  ];
  return tableMarkdown('SECTION 1 — MONTHLY SALES SUMMARY', ['Metric', 'Value'], rows);
}

function buildSection2Transactions(metrics) {
  if (metrics.transactions.length === 0) {
    return ['## SECTION 2 — SALES TRANSACTION DETAILS', '', 'No bookings were recorded during the selected month.', ''];
  }
  const header = ['Booking ID', 'Customer Name', 'Event Date', 'Event Type', 'Service/Package', 'Guests', 'Booking Amount', 'Status', 'Date Recorded'];
  const rows = metrics.transactions.map((t) => [
    t.bookingRef,
    t.customerName,
    t.eventDate,
    t.eventType,
    t.servicePackage,
    String(t.guests),
    formatCurrency(t.amount),
    t.status,
    t.dateRecorded,
  ]);
  return tableMarkdown('SECTION 2 — SALES TRANSACTION DETAILS', header, rows);
}

function buildSection3Weekly(metrics) {
  if (metrics.weeklyPerformance.length === 0) {
    return ['## SECTION 3 — SALES PERFORMANCE BY WEEK', '', 'No sales activity was recorded during the selected month.', ''];
  }
  const rows = metrics.weeklyPerformance.map((w) => [
    `Week ${w.week}`,
    formatNumber(w.bookingsCount),
    formatCurrency(w.totalSales),
    w.average === null ? 'N/A' : formatCurrency(w.average),
  ]);
  rows.push([
    '**Monthly Total**',
    `**${formatNumber(metrics.monthTotal.bookingsCount)}**`,
    `**${formatCurrency(metrics.monthTotal.totalSales)}**`,
    metrics.monthTotal.average === null ? 'N/A' : `**${formatCurrency(metrics.monthTotal.average)}**`,
  ]);
  return tableMarkdown('SECTION 3 — SALES PERFORMANCE BY WEEK', ['Week', 'Number of Bookings', 'Total Sales', 'Average Sales per Booking'], rows);
}

function buildSection4Performance(metrics) {
  const lines = ['## SECTION 4 — SALES PERFORMANCE BY SERVICE/PACKAGE', ''];
  const header = ['Service/Package', 'Number of Bookings', 'Total Sales', 'Percentage of Total Sales', 'Performance Classification'];
  lines.push('**Sales Performance by Service (Event Type)**');
  lines.push('');
  if (metrics.servicePerformance.length === 0) {
    lines.push('No services were booked during the selected month.');
    lines.push('');
  } else {
    lines.push(tableMarkdown('', header, metrics.servicePerformance.map((s) => [
      s.name,
      formatNumber(s.bookingsCount),
      formatCurrency(s.totalSales),
      s.percentage ? `${s.percentage.toFixed(1)}%` : '0.0%',
      s.classification,
    ])).join('\n'));
    lines.push('');
  }
  lines.push('**Sales Performance by Package**');
  lines.push('');
  lines.push(tableMarkdown('', header, metrics.packagePerformance.map((p) => [
    p.name,
    formatNumber(p.bookingsCount),
    formatCurrency(p.totalSales),
    p.percentage ? `${p.percentage.toFixed(1)}%` : '0.0%',
    p.classification,
  ])).join('\n'));
  lines.push('');
  return lines;
}

function buildSection5Analytics(metrics, prevMetrics) {
  const lines = ['## SECTION 5 — SALES ANALYTICS', ''];

  const hasCurrentData = metrics.revenue > 0 || metrics.bookingsCount > 0;
  const hasPriorData = (prevMetrics?.revenue || 0) > 0 || (prevMetrics?.bookingsCount || 0) > 0;
  const revenueChange = changePercent(metrics.revenue, prevMetrics?.revenue);
  const bookingChange = changePercent(metrics.bookingsCount, prevMetrics?.bookingsCount);

  if (!hasCurrentData) {
    lines.push('- **Overall sales trend for the month:** No sales activity was recorded; there is no trend to report for this period.');
  } else if (hasPriorData) {
    const revSentence = formatChangeSentence(revenueChange);
    const bkSentence = formatChangeSentence(bookingChange);
    lines.push(`- **Overall sales trend for the month:** Total sales of ${formatCurrency(metrics.revenue)} were recorded — ${revSentence}; booking volume ${bkSentence}.`);
  } else {
    lines.push(`- **Overall sales trend for the month:** Total sales of ${formatCurrency(metrics.revenue)} across ${formatNumber(metrics.bookingsCount)} booking(s) were recorded for ${metrics.monthLabel}.`);
  }

  if (hasPriorData) {
    const revTrend = describeChange(revenueChange);
    const bkTrend = describeChange(bookingChange);
    lines.push(`- **Changes in sales compared with previous periods:** Revenue ${revTrend}; booking volume ${bkTrend}.`);
  } else {
    lines.push('- **Changes in sales compared with previous periods:** Insufficient data for comparison.');
    lines.push('- **Observed sales patterns:** Only one month of data is available; trends will become clearer as more reporting periods accumulate.');
  }

  // High/low performing periods from weekly performance.
  const activeWeeks = metrics.weeklyPerformance.filter((w) => w.bookingsCount > 0 || w.totalSales > 0);
  if (activeWeeks.length > 0) {
    const best = [...activeWeeks].sort((a, b) => b.totalSales - a.totalSales)[0];
    const worst = [...activeWeeks].sort((a, b) => a.totalSales - b.totalSales)[0];
    lines.push(`- **High-performing periods:** Week ${best.week} recorded the highest sales at ${formatCurrency(best.totalSales)} (${formatNumber(best.bookingsCount)} booking(s)).`);
    if (worst.week !== best.week) {
      lines.push(`- **Low-performing periods:** Week ${worst.week} recorded the lowest sales at ${formatCurrency(worst.totalSales)} (${formatNumber(worst.bookingsCount)} booking(s)).`);
    } else {
      lines.push('- **Low-performing periods:** Activity was evenly distributed across the month; no single week was notably low.');
    }
    const zeroWeeks = metrics.weeklyPerformance.filter((w) => w.bookingsCount === 0);
    if (zeroWeeks.length > 0) {
      lines.push(`- **Weeks with no activity:** ${zeroWeeks.map((w) => `Week ${w.week}`).join(', ')} recorded no bookings this month.`);
    }
  }

  if (metrics.mostBookedService) {
    lines.push(`- **Frequently selected services:** ${metrics.mostBookedService.name} (${formatNumber(metrics.mostBookedService.bookingsCount)} booking(s)).`);
  }
  if (metrics.mostBookedPackage) {
    lines.push(`- **Frequently selected packages:** ${metrics.mostBookedPackage.name} (${formatNumber(metrics.mostBookedPackage.bookingsCount)} booking(s)).`);
  }
  return lines;
}

function buildSection6Recommendations(metrics, prevMetrics, analyticsLines) {
  const lines = ['## SECTION 6 — DATA-DRIVEN RECOMMENDATIONS', ''];

  const highPerformers = metrics.packagePerformance.filter((p) => p.classification === 'High Performing' && p.bookingsCount > 0);
  const moderatePerformers = metrics.packagePerformance.filter((p) => p.classification === 'Moderate Performing' && p.bookingsCount > 0);
  const zeroBookings = metrics.packagePerformance.filter((p) => p.bookingsCount === 0);
  const lowWeeks = metrics.weeklyPerformance.filter((w) => w.bookingsCount === 0);

  lines.push('**What is performing well?**');
  lines.push('');
  if (highPerformers.length > 0) {
    for (const hp of highPerformers) {
      lines.push(`- ${hp.name} is the top performer with ${formatCurrency(hp.totalSales)} in sales and ${formatNumber(hp.bookingsCount)} booking(s) (${hp.percentage.toFixed(1)}% of total sales).`);
    }
  } else {
    lines.push('- No single package exceeded 30% of sales this month. Consider reviewing package pricing and positioning.');
  }
  if (metrics.mostBookedService) lines.push(`- ${metrics.mostBookedService.name} events generated the most requests (${formatNumber(metrics.mostBookedService.bookingsCount)} booking(s)).`);
  lines.push('');

  lines.push('**What needs improvement?**');
  lines.push('');
  let improvementCount = 0;
  const lowPerformers = metrics.packagePerformance.filter((p) => p.classification === 'Low Performing' && p.bookingsCount > 0);
  if (lowPerformers.length > 0) {
    improvementCount += 1;
    for (const lp of lowPerformers) {
      lines.push(`- ${lp.name} contributed only ${lp.percentage.toFixed(1)}% of sales (${formatNumber(lp.bookingsCount)} booking(s)) and may need repackaging or a promotion.`);
    }
  }
  if (zeroBookings.length > 0) {
    improvementCount += 1;
    lines.push(`- ${zeroBookings.map((p) => p.name).join(', ')} received no bookings this month — review visibility, pricing, or bundling with popular packages.`);
  }
  if (analyticsLines.lowWeek) {
    improvementCount += 1;
    lines.push(`- ${analyticsLines.lowWeek}`);
  }
  if (metrics.cancelledCount > 0) {
    improvementCount += 1;
    lines.push(`- ${formatNumber(metrics.cancelledCount)} booking(s) were cancelled during the period; review follow-up and deposits procedures.`);
  }
  if (improvementCount === 0) {
    lines.push(metrics.bookingsCount === 0
      ? '- No bookings were recorded this month; focus on customer outreach and reactivation.'
      : '- Sales were limited relative to capacity; monitor which packages respond best to promotion.');
  }
  lines.push('');

  lines.push('**What should the business consider doing?**');
  lines.push('');
  lines.push(`- Promote ${highPerformers[0]?.name || (metrics.mostBookedPackage ? metrics.mostBookedPackage.name : 'top-performing packages')} to repeat customers and in-bound leads.`);
  if (lowWeeks.length > 0) {
    const weeks = lowWeeks.map((w) => `Week ${w.week}`).join(', ');
    lines.push(`- Run targeted promotional activity during ${weeks}, which recorded no bookings this month.`);
  }
  lines.push('- Use the automated promotional email feature to reach customers with upcoming recurring events approximately one month in advance.');
  if (moderatePerformers.length > 0) lines.push(`- Nurture ${moderatePerformers.map((p) => p.name).join(', ')} with bundle offers to move them into the high-performing bracket.`);
  lines.push('');

  lines.push('**What should the business consider avoiding?**');
  lines.push('');
  lines.push('- Avoid discontinuing established services without two or more months of data confirming consistent low performance.');
  lines.push('- Avoid blanket discounts on high-performing packages, which can erode revenue without increasing demand.');
  if (metrics.cancelledCount >= metrics.bookingsCount / 2 && metrics.bookingsCount > 0) {
    lines.push('- Avoid expanding capacity while cancellation rates remain above 50% of bookings.');
  }
  lines.push('');

  lines.push('_Recommendations are generated by rule-based analysis of historical sales data and predefined business rules — not machine learning or deep learning._');
  return lines;
}

function buildSection7Insights(metrics) {
  const rows = [
    ['Total Customers/Clients', formatNumber(metrics.insights.totalCustomers)],
    ['New Customers', formatNumber(metrics.insights.newCustomers)],
    ['Returning Customers', formatNumber(metrics.insights.returningCustomers)],
    ['Most Common Event Type', metrics.insights.mostCommonEventType],
    ['Most Requested Package/Service', metrics.insights.mostRequestedPackage],
    ['Most Common Booking Period', metrics.insights.mostCommonBookingPeriod],
  ];
  return tableMarkdown('SECTION 7 — CUSTOMER AND BOOKING INSIGHTS', ['Insight', 'Value'], rows);
}

function buildSection8Promotions(metrics) {
  const lines = ['## SECTION 8 — PROMOTIONAL OPPORTUNITIES', ''];
  if (metrics.promotions.length === 0) {
    lines.push('No customers have an upcoming recurring event (anniversary/birthday) within the promotional window for this period.');
    lines.push('');
    lines.push('The system sends promotional offers approximately one month before a customer\'s next recurring event or birthday, based on stored booking information.');
    return lines;
  }
  lines.push('The system sends promotional offers approximately one month before a customer\'s next recurring event or birthday, based on stored booking information.');
  lines.push('');
  lines.push(tableMarkdown('', ['Customer', 'Event/Occasion Date', 'Event Type', 'Promotional Email Eligibility', 'Recommended Send Date', 'Promotion/Offer Status'], metrics.promotions.map((p) => [
    p.customerName,
    p.occasionDate,
    p.eventType,
    p.eligibility,
    p.recommendedSend,
    p.status,
  ])).join('\n'));
  lines.push('');
  return lines;
}

function buildSection9Conclusion(metrics, prevMetrics, recommendationsLines) {
  const lines = ['## SECTION 9 — MONTHLY CONCLUSION', ''];
  const revenueChange = changePercent(metrics.revenue, prevMetrics?.revenue);
  const strongGrowth = revenueChange !== null && revenueChange >= 10;
  const decline = revenueChange !== null && revenueChange <= -10;

  if (metrics.revenue === 0 && metrics.bookingsCount === 0) {
    lines.push('- **Overall sales performance:** No sales were recorded during the period.');
    lines.push('- **Major positive trends:** None to report; bookings will need to be re-engaged.');
  } else {
    const trendNote = decline ? 'revenue declined significantly versus the previous month' : strongGrowth ? 'revenue grew strongly versus the previous month' : 'performance remained stable';
    lines.push(`- **Overall sales performance:** Total sales reached ${formatCurrency(metrics.revenue)} across ${formatNumber(metrics.bookingsCount)} booking(s) for ${metrics.monthLabel}; ${trendNote}.`);
    lines.push(`- **Major positive trends:** ${metrics.highestSalesDay ? `The highest sales day was ${formatDateISO(metrics.highestSalesDay)}` : 'Sales activity was limited'}, led by ${metrics.mostBookedPackage ? metrics.mostBookedPackage.name : 'existing services'}.`);
  }

  const zeroPackages = metrics.packagePerformance.filter((p) => p.bookingsCount === 0);
  if (zeroPackages.length > 0) {
    lines.push(`- **Areas needing attention:** ${zeroPackages.map((p) => p.name).join(', ')} recorded no bookings; review package visibility, pricing, and promotional support.`);
  } else if (metrics.cancelledCount > 0) {
    lines.push(`- **Areas needing attention:** ${formatNumber(metrics.cancelledCount)} booking(s) were cancelled; keep follow-up and deposit procedures under review.`);
  } else {
    lines.push('- **Areas needing attention:** Continue monitoring weekly demand so low-performing weeks can be addressed early.');
  }

  const keyRecommendation = recommendationsLines.highPerformerName
    ? `prioritize ${recommendationsLines.highPerformerName} in promotions while refreshing ${zeroPackages[0]?.name || 'underperforming packages'}`
    : 'continue promoting top-performing packages and re-engage past customers through promotional email';
  lines.push(`- **Key data-driven recommendation:** ${keyRecommendation}.`);

  return lines;
}

function buildSection10Footer() {
  const lines = [];
  lines.push('## SECTION 10 — REPORT FOOTER');
  lines.push('');
  lines.push('**Prepared by:** ____________________');
  lines.push('**Reviewed by:** ____________________');
  lines.push('**Approved by:** ____________________');
  lines.push('**Date:** ____________________');
  lines.push('');
  lines.push('---');
  lines.push('_Generated by FMG Catering Services Internal Sales Management System_');
  return lines;
}

// Generic markdown table builder used by every section.
function tableMarkdown(heading, header, rows) {
  const lines = [];
  if (heading) {
    lines.push(`## ${heading}`);
    lines.push('');
  }
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (const row of rows) {
    lines.push(`| ${row.map((cell) => String(cell ?? '')).join(' | ')} |`);
  }
  lines.push('');
  return lines;
}

function buildMarkdown(metrics, prevMetrics, meta) {
  const analytics = buildSection5Analytics(metrics, prevMetrics);
  const recommendationsLines = { highPerformerName: metrics.packagePerformance.find((p) => p.classification === 'High Performing' && p.bookingsCount > 0)?.name || null };
  const lowWeekList = metrics.weeklyPerformance.filter((w) => w.bookingsCount === 0).map((w) => `Week ${w.week}`);
  const recommendations = buildSection6Recommendations(metrics, prevMetrics, { lowWeek: lowWeekList.length > 0 ? `The following weeks recorded no bookings: ${lowWeekList.join(', ')}.` : null });

  const blocks = [
    buildReportHeader(metrics, meta),
    buildSection1Summary(metrics),
    buildSection2Transactions(metrics),
    buildSection3Weekly(metrics),
    buildSection4Performance(metrics),
    analytics,
    recommendations,
    buildSection7Insights(metrics),
    buildSection8Promotions(metrics),
    buildSection9Conclusion(metrics, prevMetrics, recommendationsLines),
    buildSection10Footer(),
  ];

  // Ensure consistent blank-line separation between all sections.
  for (const block of blocks) {
    if (block[block.length - 1] !== '') block.push('');
  }

  return `${blocks.flat().join('\n')}\n`;
}

/**
 * Generate (or refresh) the monthly sales report for a given month.
 *
 * @param {object} options
 * @param {number} options.year
 * @param {number} options.month 1-12
 * @param {number|null} options.generatedBy user id (manual) or null (automated job)
 */
export async function generateMonthlyReport({ year, month, generatedBy = null }) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  const reportDate = toDateString(endDate);
  const generatedAt = new Date();

  const [metrics, prevMetrics] = await Promise.all([
    collectMonthData(year, month),
    month === 1 ? collectMonthData(year - 1, 12) : collectMonthData(year, month - 1),
  ]);

  let generatedByName = 'System Automation (scheduled job)';
  if (generatedBy) {
    const user = await queryOne('SELECT full_name FROM Users WHERE id = ?', [generatedBy]);
    if (user && user.full_name) generatedByName = user.full_name;
  }

  const existing = await queryOne(
    'SELECT id FROM Reports WHERE report_type = ? AND report_date = ?',
    ['monthly_summary', reportDate]
  );

  let reportId;
  let refreshed = false;
  if (existing) {
    reportId = existing.id;
    refreshed = true;
  } else {
    reportId = await executeWithId(
      'INSERT INTO Reports (report_type, report_date, generated_by, file_path) VALUES (?, ?, ?, ?)',
      ['monthly_summary', reportDate, generatedBy, '']
    );
  }

  const meta = {
    reportId: `FMG-${year}-${String(month).padStart(2, '0')}`,
    generatedAt: toLocalDateString(generatedAt),
    generatedByName,
  };

  const content = buildMarkdown(metrics, prevMetrics, meta);

  await fs.mkdir(MONTHLY_REPORTS_DIR, { recursive: true });
  const filename = `fmg-monthly-sales-${startDate.toISOString().slice(0, 7)}.md`;
  await fs.writeFile(path.join(MONTHLY_REPORTS_DIR, filename), content, 'utf8');

  // Generate the professional Word document (.docx)
  const docxFilename = `fmg-monthly-sales-${startDate.toISOString().slice(0, 7)}.docx`;
  try {
    const docxBuffer = await buildWordDocument(metrics, prevMetrics, meta);
    await fs.writeFile(path.join(MONTHLY_REPORTS_DIR, docxFilename), docxBuffer);
  } catch (docxErr) {
    console.error('[wordReport] Failed to generate .docx:', docxErr.message);
  }

  await execute(
    'UPDATE Reports SET file_path = ?, created_at = ? WHERE id = ?',
    [filename, generatedAt.toISOString(), reportId]
  );

  return {
    reportId,
    refreshed,
    filename,
    docxFilename,
    summary: { ...metrics, report_date: reportDate },
  };
}

export async function latestMonthlyReportExists(year, month) {
  const endDate = toDateString(new Date(Date.UTC(year, month, 0)));
  const existing = await queryOne(
    'SELECT id FROM Reports WHERE report_type = ? AND report_date = ?',
    ['monthly_summary', endDate]
  );
  return Boolean(existing);
}

// Returns the newest stored monthly summary report with its markdown content,
// or null if the automated report has not been generated yet.
export async function getLatestMonthlyReport() {
  const report = await queryOne(`
    SELECT r.id, r.report_type, r.report_date, r.file_path, r.created_at, u.full_name as generated_by_name
    FROM Reports r
    LEFT JOIN Users u ON r.generated_by = u.id
    WHERE r.report_type = 'monthly_summary'
    ORDER BY r.report_date DESC, r.created_at DESC
    LIMIT 1
  `);
  if (!report) return null;

  let markdown = null;
  const filePath = path.join(MONTHLY_REPORTS_DIR, path.basename(report.file_path));
  try {
    markdown = await fs.readFile(filePath, 'utf8');
  } catch {
    if (report.report_date) {
      const [yearStr, monthStr] = String(report.report_date).split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (year && month) {
        try {
          await generateMonthlyReport({ year, month, generatedBy: null });
          markdown = await fs.readFile(filePath, 'utf8');
        } catch {
          markdown = null;
        }
      }
    }
  }

  return { report, markdown };
}