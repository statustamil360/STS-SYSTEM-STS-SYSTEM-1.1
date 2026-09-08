const pool = require('../config/db');
const { STORAGE_TIMEZONE } = require('../utils/dateTimeDisplay');

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

const sessionDurationSql = `GREATEST(0, TIMESTAMPDIFF(
  SECOND,
  GREATEST(s.joined_at, COALESCE(c.accepted_at, s.joined_at)),
  LEAST(
    COALESCE(s.left_at, COALESCE(c.ended_at, NOW())),
    COALESCE(c.ended_at, NOW())
  )
))`;

const meetingDurationSql = `GREATEST(0, TIMESTAMPDIFF(
  SECOND,
  c.accepted_at,
  COALESCE(c.ended_at, NOW())
))`;

const wallClockNowMs = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORAGE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second'),
  );
};

const MERGE_GAP_MS = 2 * 60 * 1000;

const pad2 = (n) => String(n).padStart(2, '0');

const parseSqlMs = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    return Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0),
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const formatNaiveFromMs = (ms) => {
  if (ms == null) return null;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
};

const formatClockLabel = (value) => {
  if (!value) return '—';
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  const hours = Number(match[1]);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return String(value);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad2(hour12)}:${match[2]} ${suffix}`;
};

const clampMs = (ms, start, end) => {
  if (ms == null) return null;
  let next = ms;
  if (start != null && next < start) next = start;
  if (end != null && next > end) next = end;
  return next;
};

/** Collapse reconnect/overlap rows into presence inside the meeting window. */
const mergeParticipantSessions = (rawSessions, meetingStart, meetingEnd) => {
  const now = wallClockNowMs();
  const endBound = meetingEnd || now;
  const intervals = rawSessions
    .map((session) => {
      const joined = clampMs(parseSqlMs(session.joined_at), meetingStart, endBound);
      const left = clampMs(parseSqlMs(session.left_at) || now, meetingStart, endBound);
      if (joined == null || left == null || left <= joined) return null;
      return { ...session, joined_ms: joined, left_ms: left };
    })
    .filter(Boolean)
    .sort((a, b) => a.joined_ms - b.joined_ms);

  const merged = [];
  intervals.forEach((interval) => {
    const last = merged[merged.length - 1];
    if (last && interval.joined_ms <= last.left_ms + MERGE_GAP_MS) {
      last.left_ms = Math.max(last.left_ms, interval.left_ms);
      return;
    }
    merged.push({ ...interval });
  });

  return merged.map((interval) => ({
    id: interval.id,
    joined_at: formatNaiveFromMs(interval.joined_ms),
    left_at: formatNaiveFromMs(interval.left_ms),
    duration_seconds: Math.max(0, Math.floor((interval.left_ms - interval.joined_ms) / 1000)),
  }));
};

const secondsBetween = (start, end) => {
  const startMs = parseSqlMs(start);
  const endMs = parseSqlMs(end);
  if (startMs == null || endMs == null) return 0;
  return Math.max(0, Math.floor((endMs - startMs) / 1000));
};

/** Keep one open session per person; reopen a just-ended row on reconnect. */
const startSession = async (conferenceId, userId, executor = pool) => {
  await ensureSessionsTable();
  const [openRows] = await executor.execute(
    `SELECT id FROM conference_participant_sessions
     WHERE conference_id = ? AND user_id = ? AND left_at IS NULL
     ORDER BY joined_at DESC LIMIT 1`,
    [conferenceId, userId]
  );
  if (openRows.length) return openRows[0].id;

  const [recentRows] = await executor.execute(
    `SELECT id FROM conference_participant_sessions
     WHERE conference_id = ? AND user_id = ?
       AND left_at IS NOT NULL
       AND TIMESTAMPDIFF(SECOND, left_at, NOW()) < 120
     ORDER BY left_at DESC LIMIT 1`,
    [conferenceId, userId]
  );
  if (recentRows.length) {
    await executor.execute(
      'UPDATE conference_participant_sessions SET left_at = NULL WHERE id = ?',
      [recentRows[0].id]
    );
    return recentRows[0].id;
  }

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

/** Count participants who are still in the meeting (no leave recorded). */
const countOpenSessions = async (conferenceId, executor = pool) => {
  await ensureSessionsTable();
  const [rows] = await executor.execute(
    `SELECT COUNT(*) AS cnt FROM conference_participant_sessions
     WHERE conference_id = ? AND left_at IS NULL`,
    [conferenceId]
  );
  return Number(rows[0]?.cnt || 0);
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
    `SELECT s.id, s.conference_id, s.user_id,
            DATE_FORMAT(s.joined_at, '%Y-%m-%d %H:%i:%s') AS joined_at,
            DATE_FORMAT(s.left_at, '%Y-%m-%d %H:%i:%s') AS left_at,
            ${sessionDurationSql} AS duration_seconds,
            cp.role_in_conference,
            COALESCE(
              NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
              u.username
            ) AS display_name
     FROM conference_participant_sessions s
     JOIN conferences c ON c.id = s.conference_id
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
  const [[conference]] = await pool.execute(
    `SELECT DATE_FORMAT(accepted_at, '%Y-%m-%d %H:%i:%s') AS accepted_at,
            DATE_FORMAT(ended_at, '%Y-%m-%d %H:%i:%s') AS ended_at,
            TIME_FORMAT(accepted_at, '%H:%i:%s') AS started_time,
            TIME_FORMAT(ended_at, '%H:%i:%s') AS ended_time,
            ${meetingDurationSql} AS meeting_seconds
     FROM conferences c
     WHERE c.id = ?`,
    [conferenceId]
  );

  const sessions = await fetchSessionsForConference(conferenceId);
  const meetingStart = parseSqlMs(conference?.accepted_at);
  const meetingEnd = parseSqlMs(conference?.ended_at);
  const meetingTotalSeconds = Number(conference?.meeting_seconds) || 0;
  const byUser = new Map();

  sessions.forEach((s) => {
    const key = s.user_id;
    if (!byUser.has(key)) {
      byUser.set(key, {
        user_id: s.user_id,
        display_name: s.display_name,
        role: s.role_in_conference || 'other',
        raw: [],
      });
    }
    byUser.get(key).raw.push(s);
  });

  const participants = [...byUser.values()].map((entry) => {
    const merged = mergeParticipantSessions(entry.raw, meetingStart, meetingEnd);
    return {
      user_id: entry.user_id,
      display_name: entry.display_name,
      role: entry.role,
      total_seconds: merged.reduce((sum, session) => sum + session.duration_seconds, 0),
      sessions: merged,
    };
  }).sort((a, b) => b.total_seconds - a.total_seconds);

  return {
    conference_id: Number(conferenceId),
    participants,
    meeting_total_seconds: meetingTotalSeconds,
    started_time: conference?.started_time || null,
    ended_time: conference?.ended_time || null,
  };
};

const getConferenceParticipantOverview = async (conferenceId) => {
  const [assigned] = await pool.execute(
    `SELECT cp.user_id,
            COALESCE(g.guest_role, cp.role_in_conference) AS role,
            COALESCE(
              NULLIF(TRIM(g.guest_name), ''),
              NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
              u.username
            ) AS display_name,
            CASE WHEN g.id IS NOT NULL THEN 1 ELSE 0 END AS is_guest
     FROM conference_participants cp
     JOIN users u ON u.id = cp.user_id
     LEFT JOIN user_profiles up ON up.user_id = cp.user_id
     LEFT JOIN conference_guest_access g
       ON g.conference_id = cp.conference_id
      AND g.user_id = cp.user_id
      AND g.revoked_at IS NULL
     WHERE cp.conference_id = ?
     ORDER BY cp.id`,
    [conferenceId]
  );

  const attendance = await getConferenceAttendance(conferenceId);
  return {
    assigned: assigned.map((row) => ({
      user_id: row.user_id,
      role: row.role,
      display_name: row.display_name,
      is_guest: Boolean(row.is_guest),
    })),
    joined: attendance.participants,
  };
};

/** Salary summary for admin / receptionist dashboard (current calendar month). */
const getMonthlyJoinSummary = async () => {
  await ensureSessionsTable();
  const [sessionRows] = await pool.execute(
    `SELECT s.conference_id,
            s.user_id,
            DATE_FORMAT(s.joined_at, '%Y-%m-%d %H:%i:%s') AS joined_at,
            DATE_FORMAT(s.left_at, '%Y-%m-%d %H:%i:%s') AS left_at,
            DATE_FORMAT(c.accepted_at, '%Y-%m-%d %H:%i:%s') AS accepted_at,
            DATE_FORMAT(c.ended_at, '%Y-%m-%d %H:%i:%s') AS ended_at,
            ${meetingDurationSql} AS meeting_seconds,
            cp.role_in_conference AS role
     FROM conference_participant_sessions s
     JOIN conferences c ON c.id = s.conference_id
     LEFT JOIN conference_participants cp
       ON cp.conference_id = s.conference_id AND cp.user_id = s.user_id
     WHERE c.status IN ('completed', 'cancelled', 'live')
       AND YEAR(c.scheduled_date) = YEAR(CURDATE())
       AND MONTH(c.scheduled_date) = MONTH(CURDATE())
     ORDER BY s.conference_id, s.user_id, s.joined_at`
  );

  const [recentConferences] = await pool.execute(
    `SELECT c.id, c.conference_code,
            DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
            TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
            CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
            ${meetingDurationSql} AS total_seconds
     FROM conferences c
     JOIN patients pat ON pat.id = c.patient_id
     WHERE c.status IN ('completed', 'cancelled', 'live')
       AND c.accepted_at IS NOT NULL
       AND YEAR(c.scheduled_date) = YEAR(CURDATE())
       AND MONTH(c.scheduled_date) = MONTH(CURDATE())
     ORDER BY c.scheduled_date DESC, c.scheduled_time DESC
     LIMIT 8`
  );

  const [[monthRow]] = await pool.execute(
    `SELECT COALESCE(SUM(${meetingDurationSql}), 0) AS month_total
     FROM conferences c
     WHERE c.status IN ('completed', 'cancelled', 'live')
       AND c.accepted_at IS NOT NULL
       AND YEAR(c.scheduled_date) = YEAR(CURDATE())
       AND MONTH(c.scheduled_date) = MONTH(CURDATE())`
  );

  const byRole = new Map();
  const byConferenceUser = new Map();
  sessionRows.forEach((row) => {
    const key = `${row.conference_id}:${row.user_id}`;
    if (!byConferenceUser.has(key)) {
      byConferenceUser.set(key, {
        conference_id: row.conference_id,
        user_id: row.user_id,
        role: row.role || 'other',
        accepted_at: row.accepted_at,
        ended_at: row.ended_at,
        raw: [],
      });
    }
    byConferenceUser.get(key).raw.push(row);
  });

  byConferenceUser.forEach((entry) => {
    const merged = mergeParticipantSessions(
      entry.raw,
      parseSqlMs(entry.accepted_at),
      parseSqlMs(entry.ended_at),
    );
    const total = merged.reduce((sum, session) => sum + session.duration_seconds, 0);
    const current = byRole.get(entry.role) || {
      role: entry.role,
      total_seconds: 0,
      conference_ids: new Set(),
      user_ids: new Set(),
    };
    current.total_seconds += total;
    current.conference_ids.add(String(entry.conference_id));
    current.user_ids.add(String(entry.user_id));
    byRole.set(entry.role, current);
  });

  const roleTotals = [...byRole.values()]
    .map((r) => ({
      role: r.role,
      total_seconds: r.total_seconds,
      conference_count: r.conference_ids.size,
      participant_count: r.user_ids.size,
    }))
    .sort((a, b) => b.total_seconds - a.total_seconds);

  const monthTotal = Number(monthRow?.month_total) || 0;

  return {
    month_label: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    month_total_seconds: monthTotal,
    by_role: roleTotals,
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
           DATE_FORMAT(c.accepted_at, '%Y-%m-%d %H:%i:%s') AS accepted_at,
           DATE_FORMAT(c.ended_at, '%Y-%m-%d %H:%i:%s') AS ended_at,
           TIME_FORMAT(c.accepted_at, '%H:%i:%s') AS started_time,
           TIME_FORMAT(c.ended_at, '%H:%i:%s') AS ended_time,
           ${meetingDurationSql} AS meeting_seconds,
           pat.id AS patient_id,
           CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
           s.user_id AS participant_user_id,
           COALESCE(
             NULLIF(TRIM(CONCAT(up.first_name, ' ', up.last_name)), ''),
             u.username
           ) AS participant_name,
           COALESCE(g.guest_role, cp.role_in_conference) AS participant_role,
           DATE_FORMAT(s.joined_at, '%Y-%m-%d %H:%i:%s') AS joined_at,
           DATE_FORMAT(s.left_at, '%Y-%m-%d %H:%i:%s') AS left_at
    FROM conference_participant_sessions s
    JOIN conferences c ON c.id = s.conference_id
    JOIN patients pat ON pat.id = c.patient_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN user_profiles up ON up.user_id = s.user_id
     LEFT JOIN conference_participants cp
       ON cp.conference_id = s.conference_id AND cp.user_id = s.user_id
     LEFT JOIN conference_guest_access g
       ON g.conference_id = s.conference_id AND g.user_id = s.user_id AND g.revoked_at IS NULL
     WHERE c.scheduled_date = ?
       AND c.status IN ('completed', 'cancelled', 'live')
  `;
  const params = [date];

  if (patientId) {
    query += ' AND pat.id = ?';
    params.push(Number(patientId));
  }

  if (role === 'guest') {
    query += ' AND g.id IS NOT NULL';
  } else if (role && ['gp', 'ahp'].includes(role)) {
    query += ' AND cp.role_in_conference = ? AND g.id IS NULL';
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

  const conferences = new Map();
  rows.forEach((row) => {
    let conference = conferences.get(row.conference_id);
    if (!conference) {
      conference = {
        conference_id: row.conference_id,
        conference_code: row.conference_code,
        meeting_date: row.meeting_date,
        meeting_time: row.meeting_time,
        patient_id: row.patient_id,
        patient_name: row.patient_name,
        accepted_at: row.accepted_at,
        ended_at: row.ended_at,
        started_time: row.started_time,
        ended_time: row.ended_time,
        meeting_seconds: Number(row.meeting_seconds) || 0,
        first_joined_at: row.joined_at,
        last_left_at: row.left_at,
        participants: new Map(),
      };
      conferences.set(row.conference_id, conference);
    }

    const joinedMs = parseSqlMs(row.joined_at);
    const leftMs = parseSqlMs(row.left_at);
    const firstMs = parseSqlMs(conference.first_joined_at);
    const lastMs = parseSqlMs(conference.last_left_at);
    if (joinedMs != null && (firstMs == null || joinedMs < firstMs)) {
      conference.first_joined_at = row.joined_at;
    }
    if (leftMs != null && (lastMs == null || leftMs > lastMs)) {
      conference.last_left_at = row.left_at;
    }

    const participant = conference.participants.get(row.participant_user_id);
    if (!participant) {
      conference.participants.set(row.participant_user_id, {
        participant_user_id: row.participant_user_id,
        participant_name: row.participant_name,
        participant_role: row.participant_role || 'other',
        raw: [row],
      });
      return;
    }
    participant.raw.push(row);
  });

  const formattedRows = [...conferences.values()].map((conference) => {
    const startedAt = conference.accepted_at || conference.first_joined_at;
    const endedAt = conference.ended_at || conference.last_left_at;
    const durationSeconds = Number(conference.meeting_seconds) || secondsBetween(startedAt, endedAt);
    const meetingStart = parseSqlMs(conference.accepted_at);
    const meetingEnd = parseSqlMs(conference.ended_at);
    const participants = [...conference.participants.values()]
      .map((participant) => {
        const merged = mergeParticipantSessions(participant.raw, meetingStart, meetingEnd);
        const duration = merged.reduce((sum, session) => sum + session.duration_seconds, 0);
        return {
          participant_user_id: participant.participant_user_id,
          participant_name: participant.participant_name,
          participant_role: participant.participant_role,
          duration_seconds: duration,
          duration_label: formatDurationLabel(duration),
        };
      })
      .sort((a, b) => b.duration_seconds - a.duration_seconds);

    return {
      id: conference.conference_id,
      conference_id: conference.conference_id,
      conference_code: conference.conference_code,
      meeting_date: conference.meeting_date,
      meeting_time: conference.meeting_time,
      patient_id: conference.patient_id,
      patient_name: conference.patient_name,
      started_at: startedAt,
      ended_at: endedAt,
      started_time: conference.started_time,
      ended_time: conference.ended_time,
      duration_seconds: durationSeconds,
      duration_label: formatDurationLabel(durationSeconds),
      participant_count: participants.length,
      participants,
    };
  }).sort((a, b) => String(a.meeting_time || '').localeCompare(String(b.meeting_time || '')));

  const grandTotalSeconds = formattedRows.reduce((sum, row) => sum + row.duration_seconds, 0);

  const summary = {
    grand_total_seconds: grandTotalSeconds,
    grand_total_label: formatDurationLabel(grandTotalSeconds),
    participant_count: formattedRows.reduce((sum, row) => sum + row.participant_count, 0),
    session_count: formattedRows.length,
    conference_count: formattedRows.length,
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
  countOpenSessions,
  endAllSessions,
  getConferenceAttendance,
  getConferenceParticipantOverview,
  getMonthlyJoinSummary,
  getJoinTimeReport,
  formatDurationLabel,
  formatClockLabel,
};
