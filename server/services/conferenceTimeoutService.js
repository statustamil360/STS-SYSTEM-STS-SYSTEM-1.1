const pool = require('../config/db');

const TIMEOUT_MINUTES = 10;
const TIMEOUT_REASON = 'time out';

exports.TIMEOUT_MINUTES = TIMEOUT_MINUTES;
exports.TIMEOUT_REASON = TIMEOUT_REASON;

/**
 * Cancel conferences that were not accepted within 10 minutes of start time.
 * Also cancels the linked appointment and records the timeout reason.
 */
exports.processTimedOutConferences = async (executor = pool) => {
  const [timedOut] = await executor.execute(
    `SELECT c.id, c.appointment_id
     FROM conferences c
     WHERE c.status IN ('scheduled', 'waiting')
       AND TIMESTAMP(c.scheduled_date, c.scheduled_time) <= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    [TIMEOUT_MINUTES]
  );

  if (!timedOut.length) return 0;

  const ids = timedOut.map((r) => r.id);
  const appointmentIds = timedOut.map((r) => r.appointment_id).filter(Boolean);

  await executor.execute(
    `UPDATE conferences
     SET status = 'cancelled', cancelled_reason = ?, cancelled_at = NOW()
     WHERE id IN (${ids.map(() => '?').join(',')})`,
    [TIMEOUT_REASON, ...ids]
  );

  if (appointmentIds.length) {
    await executor.execute(
      `UPDATE appointments
       SET status = 'cancelled', cancelled_reason = ?
       WHERE id IN (${appointmentIds.map(() => '?').join(',')})
         AND status IN ('scheduled', 'confirmed')`,
      [TIMEOUT_REASON, ...appointmentIds]
    );
  }

  return timedOut.length;
};
