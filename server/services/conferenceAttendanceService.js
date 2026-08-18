const pool = require('../config/db');

let tableReady = false;
let legacyBackfillDone = false;

const ensureSessionsTable = async () => {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS conference_participant_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conference_id INT NOT NULL,
      user_id INT NOT NULL,
      joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      left_at TIMESTAMP NULL,
      FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_cps_conf_user (conference_id, user_id),
      INDEX idx_cps_open (conference_id, left_at)
    )
  `);
  tableReady = true;
  await backfillLegacySessions();
};

/** Import historical join times from conference_participants when sessions are missing. */
const backfillLegacySessions = async () => {
  if (legacyBackfillDone) return;
  await pool.execute(
    `INSERT INTO conference_participant_sessions (conference_id, user_id, joined_at, left_at)
     SELECT cp.conference_id,
            cp.user_id,
            cp.joined_at,
            COALESCE(cp.left_at, c.ended_at, DATE_ADD(cp.joined_at, INTERVAL 90 MINUTE))
     FROM conference_participants cp
     JOIN conferences c ON c.id = cp.conference_id
     WHERE cp.joined_at IS NOT NULL
       AND c.status IN ('completed', 'cancelled', 'live')
       AND NOT EXISTS (
         SELECT 1 FROM conference_participant_sessions s
         WHERE s.conference_id = cp.conference_id AND s.user_id = cp.user_id
       )`
  );
  legacyBackfillDone = true;

  // Correct legacy rows where conference.updated_at inflated duration.
  await pool.execute(
    `UPDATE conference_participant_sessions s
     JOIN conferences c ON c.id = s.conference_id
     SET s.left_at = DATE_ADD(s.joined_at, INTERVAL 90 MINUTE)
     WHERE c.ended_at IS NULL
       AND TIMESTAMPDIFF(MINUTE, s.joined_at, s.left_at) > 180`
  );
};

const sessionDurationSql = `TIMESTAMPDIFF(
  SECOND,
  s.joined_at,
  COALESCE(s.left_at, NOW())
)`;

/** Close any open session, then start a new one (handles rejoin). */
const startSession = async (conferenceId, userId, executor = pool) => {
  await ensureSessionsTable();
  await executor.execute(
    `UPDATE conference_participant_sessions
     SET left_at = NOW()
     WHERE conference_id = ? AND user_id = ? AND left_at IS NULL`,
    [conferenceId, userId]
  );
  const [result] = await executor.execute(
    `INSERT INTO conference_participant_sessions (conference_id, user_id, joined_at)
     VALUES (?, ?, NOW())`,
    [conferenceId, userId]
  );
  return result.insertId;
};

/** Close the current open session for a participant. */
const endSession = async (conferenceId, userId, executor = pool) => {
  await ensureSessionsTable();
  const [result] = await executor.execute(
    `UPDATE conference_participant_sessions
     SET left_at = NOW()
     WHERE conference_id = ? AND user_id = ? AND left_at IS NULL`,
    [conferenceId, userId]
  );
  return result.affectedRows;
};

/** Close all open sessions when a meeting ends or is cancelled. */
const endAllSessions = async (conferenceId, executor = pool) => {
  await ensureSessionsTable();
  const [result] = await executor.execute(
    `UPDATE conference_participant_sessions
     SET left_at = NOW()
     WHERE conference_id = ? AND left_at IS NULL`,
    [conferenceId]
  );
  return result.affectedRows;
};

const fetchSessionsForConference = async (conferenceId) => {
  await ensureSessionsTable();
  const [rows] = await pool.execute(
    `SELECT s.id, s.conference_id, s.user_id, s.joined_at, s.left_at,
            ${sessionDurationSql} AS duration_seconds,
            cp.role_in_conference,
            COALESCE(
              NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
              u.username
            ) AS display_name
     FROM conference_participant_sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN user_profiles up ON up.user_id = s.user_id
     LEFT JOIN conference_participants cp
       ON cp.conference_id = s.conference_id AND cp.user_id = s.user_id
     WHERE s.conference_id = ?
     ORDER BY s.user_id ASC, s.joined_at ASC`,
    [conferenceId]
  );
  return rows;
};

/** Group sessions by participant with totals. */
const getConferenceAttendance = async (conferenceId) => {
  const sessions = await fetchSessionsForConference(conferenceId);
  const byUser = new Map();

  sessions.forEach((s) => {
    const key = s.user_id;
    if (!byUser.has(key)) {
      byUser.set(key, {
        user_id: s.user_id,
        display_name: s.display_name,
        role: s.role_in_conference || 'other',
        total_seconds: 0,
        sessions: [],
      });
    }
    const entry = byUser.get(key);
    const duration = Number(s.duration_seconds) || 0;
    entry.total_seconds += duration;
    entry.sessions.push({
      id: s.id,
      joined_at: s.joined_at,
      left_at: s.left_at,
      duration_seconds: duration,
    });
  });

  const participants = [...byUser.values()].sort(
    (a, b) => b.total_seconds - a.total_seconds
  );

  return {
    conference_id: Number(conferenceId),
    participants,
    meeting_total_seconds: participants.reduce((sum, p) => sum + p.total_seconds, 0),
  };
};

/** Salary summary for admin / receptionist dashboard (current calendar month). */
const getMonthlyJoinSummary = async () => {
  await ensureSessionsTable();
  const [roleTotals] = await pool.execute(
    `SELECT cp.role_in_conference AS role,
            SUM(${sessionDurationSql}) AS total_seconds,
            COUNT(DISTINCT s.conference_id) AS conference_count,
            COUNT(DISTINCT s.user_id) AS participant_count
     FROM conference_participant_sessions s
     JOIN conferences c ON c.id = s.conference_id
     LEFT JOIN conference_participants cp
       ON cp.conference_id = s.conference_id AND cp.user_id = s.user_id
     WHERE c.status IN ('completed', 'cancelled', 'live')
       AND YEAR(c.scheduled_date) = YEAR(CURDATE())
       AND MONTH(c.scheduled_date) = MONTH(CURDATE())
     GROUP BY cp.role_in_conference
     ORDER BY total_seconds DESC`
  );

  const [recentConferences] = await pool.execute(
    `SELECT c.id, c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            SUM(${sessionDurationSql}) AS total_seconds
     FROM conferences c
     JOIN patients pat ON pat.id = c.patient_id
     LEFT JOIN conference_participant_sessions s ON s.conference_id = c.id
     WHERE c.status IN ('completed', 'cancelled', 'live')
       AND YEAR(c.scheduled_date) = YEAR(CURDATE())
       AND MONTH(c.scheduled_date) = MONTH(CURDATE())
     GROUP BY c.id, c.conference_code, c.scheduled_date, c.scheduled_time, patient_name
     ORDER BY c.scheduled_date DESC, c.scheduled_time DESC
     LIMIT 8`
  );

  const monthTotal = roleTotals.reduce(
    (sum, r) => sum + (Number(r.total_seconds) || 0),
    0
  );

  return {
    month_label: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    month_total_seconds: monthTotal,
    by_role: roleTotals.map((r) => ({
      role: r.role || 'other',
      total_seconds: Number(r.total_seconds) || 0,
      conference_count: Number(r.conference_count) || 0,
      participant_count: Number(r.participant_count) || 0,
    })),
    recent_conferences: recentConferences.map((r) => ({
      ...r,
      total_seconds: Number(r.total_seconds) || 0,
    })),
  };
};

const formatDurationLabel = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
};

/** Filtered join-time report for receptionist salary page. */
const getJoinTimeReport = async (filters = {}) => {
  await ensureSessionsTable();

  const {
    date,
    patient_id: patientId,
    role,
    gp_id: gpId,
    ahp_id: ahpId,
  } = filters;

  if (!date) {
    const error = new Error('Date is required');
    error.statusCode = 400;
    throw error;
  }

  let query = `
    SELECT s.id AS session_id,
           c.id AS conference_id,
           c.conference_code,
           DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS meeting_date,
           TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS meeting_time,
           pat.id AS patient_id,
           CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
           s.user_id AS participant_user_id,
           COALESCE(
             NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
             u.username
           ) AS participant_name,
           cp.role_in_conference AS participant_role,
           s.joined_at,
           s.left_at,
           ${sessionDurationSql} AS duration_seconds
    FROM conference_participant_sessions s
    JOIN conferences c ON c.id = s.conference_id
    JOIN patients pat ON pat.id = c.patient_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN user_profiles up ON up.user_id = s.user_id
     LEFT JOIN conference_participants cp
       ON cp.conference_id = s.conference_id AND cp.user_id = s.user_id
     WHERE c.scheduled_date = ?
       AND c.status IN ('completed', 'cancelled', 'live')
  `;
  const params = [date];

  if (patientId) {
    query += ' AND pat.id = ?';
    params.push(Number(patientId));
  }

  if (role && ['gp', 'ahp'].includes(role)) {
    query += ' AND cp.role_in_conference = ?';
    params.push(role);
  }

  if (gpId) {
    const [gpRows] = await pool.execute('SELECT user_id FROM gps WHERE id = ?', [Number(gpId)]);
    if (gpRows.length) {
      query += ' AND s.user_id = ?';
      params.push(gpRows[0].user_id);
    }
  } else if (ahpId) {
    const [ahpRows] = await pool.execute(
      'SELECT user_id FROM allied_health_professionals WHERE id = ?',
      [Number(ahpId)]
    );
    if (ahpRows.length) {
      query += ' AND s.user_id = ?';
      params.push(ahpRows[0].user_id);
    }
  }

  query += ' ORDER BY c.scheduled_time ASC, patient_name ASC, s.joined_at ASC';

  const [rows] = await pool.execute(query, params);

  const formattedRows = rows.map((row) => ({
    session_id: row.session_id,
    conference_id: row.conference_id,
    conference_code: row.conference_code,
    meeting_date: row.meeting_date,
    meeting_time: row.meeting_time,
    patient_id: row.patient_id,
    patient_name: row.patient_name,
    participant_user_id: row.participant_user_id,
    participant_name: row.participant_name,
    participant_role: row.participant_role || 'other',
    joined_at: row.joined_at,
    left_at: row.left_at,
    duration_seconds: Number(row.duration_seconds) || 0,
    duration_label: formatDurationLabel(row.duration_seconds),
  }));

  const participantTotals = new Map();
  const patientTotals = new Map();
  let grandTotalSeconds = 0;

  formattedRows.forEach((row) => {
    grandTotalSeconds += row.duration_seconds;

    const pKey = row.participant_user_id;
    if (!participantTotals.has(pKey)) {
      participantTotals.set(pKey, {
        participant_user_id: row.participant_user_id,
        participant_name: row.participant_name,
        participant_role: row.participant_role,
        total_seconds: 0,
        session_count: 0,
      });
    }
    const pEntry = participantTotals.get(pKey);
    pEntry.total_seconds += row.duration_seconds;
    pEntry.session_count += 1;

    const patKey = row.patient_id;
    if (!patientTotals.has(patKey)) {
      patientTotals.set(patKey, {
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        total_seconds: 0,
        session_count: 0,
      });
    }
    const patEntry = patientTotals.get(patKey);
    patEntry.total_seconds += row.duration_seconds;
    patEntry.session_count += 1;
  });

  const summary = {
    grand_total_seconds: grandTotalSeconds,
    grand_total_label: formatDurationLabel(grandTotalSeconds),
    participant_count: participantTotals.size,
    session_count: formattedRows.length,
    conference_count: new Set(formattedRows.map((r) => r.conference_id)).size,
    by_participant: [...participantTotals.values()]
      .map((p) => ({ ...p, total_label: formatDurationLabel(p.total_seconds) }))
      .sort((a, b) => b.total_seconds - a.total_seconds),
    by_patient: [...patientTotals.values()]
      .map((p) => ({ ...p, total_label: formatDurationLabel(p.total_seconds) }))
      .sort((a, b) => b.total_seconds - a.total_seconds),
  };

  return {
    filters: {
      date,
      patient_id: patientId || null,
      role: role || null,
      gp_id: gpId || null,
      ahp_id: ahpId || null,
    },
    summary,
    rows: formattedRows,
  };
};

module.exports = {
  ensureSessionsTable,
  startSession,
  endSession,
  endAllSessions,
  getConferenceAttendance,
  getMonthlyJoinSummary,
  getJoinTimeReport,
  formatDurationLabel,
};
