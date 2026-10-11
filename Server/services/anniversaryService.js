import { query, execute } from '../config/dbHelper.js';
import { sendAnniversaryEmail } from './emailService.js';

// Convert a Date object to YYYY-MM-DD
function toDateString(d) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate the next annual anniversary date (at UTC noon to avoid timezone shift)
function calculateNextAnniversary(originalDate, fromDate = new Date()) {
  const orig = new Date(String(originalDate).slice(0, 10) + 'T12:00:00Z');
  if (Number.isNaN(orig.getTime())) return null;

  const month = orig.getUTCMonth();
  const day = orig.getUTCDate();

  let candidateYear = fromDate.getUTCFullYear();
  let candidate = new Date(Date.UTC(candidateYear, month, day, 12, 0, 0));

  // If the candidate anniversary has already passed for this year (or is today with target behind),
  // look at next year's anniversary.
  if (candidate.getTime() <= fromDate.getTime() - 86400000) {
    candidateYear += 1;
    candidate = new Date(Date.UTC(candidateYear, month, day, 12, 0, 0));
  }

  return candidate;
}

/**
 * Find all completed bookings and compute their upcoming anniversary status.
 * Target window: promotional email is scheduled 30 days before the anniversary.
 */
export async function getAnniversaryCandidates(refDate = new Date()) {
  const rows = await query(`
    SELECT b.id AS booking_id, b.customer_id, b.event_type, b.event_date, b.status,
           c.name AS customer_name, c.email AS customer_email
    FROM Bookings b
    JOIN Customers c ON b.customer_id = c.id
    WHERE b.status = 'completed'
      AND c.email IS NOT NULL AND c.email != ''
      AND b.event_date IS NOT NULL
    ORDER BY b.event_date DESC
  `);

  const recentEmailLogs = await query(`
    SELECT recipient_email, subject, sent_at
    FROM EmailLogs
    WHERE email_type = 'anniversary_reminder'
      AND status = 'sent'
  `);

  const candidates = [];
  const nowMs = refDate.getTime();

  for (const row of rows) {
    const nextAnniversary = calculateNextAnniversary(row.event_date, refDate);
    if (!nextAnniversary) continue;

    const msUntilAnniversary = nextAnniversary.getTime() - nowMs;
    const daysUntilAnniversary = Math.round(msUntilAnniversary / 86400000);

    // Recommended send date is 30 days before anniversary
    const recommendedSend = new Date(nextAnniversary.getTime() - 30 * 86400000);
    const msUntilSend = recommendedSend.getTime() - nowMs;
    const daysUntilSend = Math.round(msUntilSend / 86400000);

    // Check if an anniversary email was sent in the last 180 days to this email
    const wasRecentlySent = recentEmailLogs.some((log) => {
      if (log.recipient_email?.toLowerCase() !== row.customer_email?.toLowerCase()) return false;
      const sentTime = new Date(log.sent_at).getTime();
      return Math.abs(nowMs - sentTime) < 180 * 86400000;
    });

    // Eligible if within the window (~24 to 36 days before anniversary, i.e. around the 30-day mark)
    // or if scheduled send date is passed/today and within 35 days of anniversary.
    const inSendWindow = daysUntilAnniversary >= 1 && daysUntilAnniversary <= 36 && daysUntilSend <= 5;
    const isEligible = inSendWindow && !wasRecentlySent;

    let statusLabel = 'upcoming';
    if (wasRecentlySent) {
      statusLabel = 'already_sent';
    } else if (isEligible) {
      statusLabel = 'ready_to_send';
    }

    candidates.push({
      bookingId: row.booking_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      eventType: row.event_type || 'Event',
      originalEventDate: String(row.event_date).slice(0, 10),
      nextAnniversaryDate: toDateString(nextAnniversary),
      recommendedSendDate: toDateString(recommendedSend),
      daysUntilAnniversary,
      daysUntilSend,
      isEligible,
      status: statusLabel,
    });
  }

  // Sort by days until recommended send date ascending
  candidates.sort((a, b) => a.daysUntilSend - b.daysUntilSend);

  return candidates;
}

/**
 * Process and dispatch anniversary reminder emails to all eligible customers.
 */
export async function processAnniversaryEmails(refDate = new Date()) {
  const candidates = await getAnniversaryCandidates(refDate);
  const eligible = candidates.filter((c) => c.isEligible);

  const results = {
    totalChecked: candidates.length,
    eligibleCount: eligible.length,
    sentCount: 0,
    failedCount: 0,
    details: [],
  };

  for (const candidate of eligible) {
    try {
      const sendResult = await sendAnniversaryEmail(
        candidate.customerName,
        candidate.customerEmail,
        candidate.eventType,
        candidate.originalEventDate
      );

      if (sendResult.success) {
        results.sentCount += 1;
        results.details.push({
          email: candidate.customerEmail,
          customer: candidate.customerName,
          status: 'sent',
          messageId: sendResult.messageId,
        });
      } else {
        results.failedCount += 1;
        results.details.push({
          email: candidate.customerEmail,
          customer: candidate.customerName,
          status: 'failed',
          error: sendResult.error,
        });
      }
    } catch (err) {
      results.failedCount += 1;
      results.details.push({
        email: candidate.customerEmail,
        customer: candidate.customerName,
        status: 'failed',
        error: err.message,
      });
    }
  }

  return results;
}
