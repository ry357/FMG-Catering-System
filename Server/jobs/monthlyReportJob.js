import { generateMonthlyReport } from '../services/monthlyReportService.js';
import { isGoogleDocsConfigured, autoUploadMonthlyReport } from '../services/googleDocsService.js';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const STARTUP_DELAY_MS = 30 * 1000; // wait for server/db readiness before first check

let timer = null;
let running = false;
let lastCheckedMonth = null;

const monthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

// Generates the summary report for the previous, now-completed month.
async function generateForPreviousMonth() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();

  try {
    const result = await generateMonthlyReport({ year, month, generatedBy: null });
    console.log(`[monthly-report-job] Generated ${result.filename} (${result.refreshed ? 'refreshed' : 'created'})`);

    if (isGoogleDocsConfigured()) {
      try {
        await autoUploadMonthlyReport({
          id: result.reportId,
          file_path: result.filename,
          report_date: result.summary.end,
        });
        console.log('[monthly-report-job] Uploaded to Google Docs');
      } catch (uploadError) {
        console.error('[monthly-report-job] Google Docs upload failed:', uploadError.message);
      }
    }
  } catch (error) {
    console.error('[monthly-report-job] Failed to generate monthly report:', error);
  }
}

async function check() {
  if (running) return;
  running = true;
  try {
    const current = monthKey();
    // Only generate when the month has rolled over since this process started,
    // so each completed month produces exactly one automated report.
    if (lastCheckedMonth && lastCheckedMonth !== current) {
      await generateForPreviousMonth();
    }
    lastCheckedMonth = current;
  } finally {
    running = false;
  }
}

// Lightweight self-scheduler. No external cron dependency required.
export function startMonthlyReportJob({ enabled = true } = {}) {
  if (!enabled || timer) return null;

  lastCheckedMonth = monthKey();
  timer = setTimeout(async function poll() {
    await check();
    timer = setTimeout(poll, CHECK_INTERVAL_MS);
  }, STARTUP_DELAY_MS);

  console.log('[monthly-report-job] Monthly summary scheduler started');
  return timer;
}

export function stopMonthlyReportJob() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}