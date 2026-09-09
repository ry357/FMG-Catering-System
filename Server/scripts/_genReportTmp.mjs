import { generateMonthlyReport } from '../services/monthlyReportService.js';

for (const [year, month] of [[2026, 8], [2026, 12], [2026, 9]]) {
  const label = `${year}-${String(month).padStart(2, '0')}`;
  try {
    const result = await generateMonthlyReport({ year, month, generatedBy: null });
    console.log(`=== ${label} OK reportId=${result.reportId} refreshed=${result.refreshed} file=${result.filename}`);
    console.log(`    summary: revenue=${result.summary.revenue}, bookings=${result.summary.bookingsCount}, transactions=${result.summary.transactions.length}, weekly=${result.summary.weeklyPerformance.length}, promotions=${result.summary.promotions.length}`);
  } catch (e) {
    console.error(`=== ${label} FAILED: ${e.message}`);
    console.error(e.stack);
  }
}