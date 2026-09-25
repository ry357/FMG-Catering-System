import { execute, query } from '../config/dbHelper.js';

/**
 * Log an activity. Never throws — failures are silently swallowed so a logging
 * error never breaks the main request.
 *
 * @param {object} opts
 * @param {string} opts.action        - Machine-readable action key (e.g. 'booking_approved')
 * @param {string} opts.category      - One of: bookings | sales | users | auth | system
 * @param {string} opts.description   - Human-readable summary shown in the UI
 * @param {string} [opts.performed_by]- Username, email, or 'system'
 * @param {object} [opts.details]     - Optional extra metadata (serialised to JSON)
 */
export async function logActivity({ action, category = 'system', description, performed_by = 'system', details = null }) {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    await execute(
      'INSERT INTO ActivityLogs (action, category, description, performed_by, details) VALUES (?, ?, ?, ?, ?)',
      [action, category, description, performed_by, detailsJson]
    );
  } catch (err) {
    // Non-fatal — log to console but don't propagate
    console.warn('[activityLog] Failed to write log entry:', err.message);
  }
}

/**
 * Fetch paginated activity logs with optional filters.
 *
 * @param {object} opts
 * @param {number} [opts.page=1]
 * @param {number} [opts.limit=50]
 * @param {string} [opts.category]   - Filter by category
 * @param {string} [opts.search]     - Full-text search on description / performed_by
 * @returns {{ logs: object[], total: number, page: number, totalPages: number }}
 */
export async function getActivityLogs({ page = 1, limit = 50, category = '', search = '' } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (search) {
    conditions.push('(description LIKE ? OR performed_by LIKE ? OR action LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const countRows = await query(
    `SELECT COUNT(*) as total FROM ActivityLogs ${where}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  // Paginated rows
  const logs = await query(
    `SELECT id, action, category, description, performed_by, details, created_at
     FROM ActivityLogs
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    logs: logs.map((row) => ({
      ...row,
      details: row.details ? (() => { try { return JSON.parse(row.details); } catch { return row.details; } })() : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
