const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { ensureConferenceSequence, allocateConferenceCode } = require('../utils/conferenceId');
const videoService = require('../services/videoService');
const { processTimedOutConferences } = require('../services/conferenceTimeoutService');
const { buildExport } = require('../services/exportService');
const { createAuditLog } = require('../middleware/auditLog');
const { assertClinicalDocumentDownload } = require('../middleware/receptionistPermission');
const { getNumericSetting, getStringSetting } = require('../services/settingsService');
const { ensureReportRows, lockReportsAfterMeeting } = require('../services/clinicalReportService');
const { generateParticipantDocuments, formatDocumentCode } = require('../services/clinicalDocumentService');
const { emitConferenceEnded, emitScheduleChanged, emitRecordingFlush } = require('../services/socketService');
const {
  startRecording, finalizeRecording, waitForRecordingData, ensureSchema: ensureRecordingSchema, parseBool,
} = require('../services/conferenceRecordingService');
const { createNotification, notifyConferenceParticipants } = require('../services/notificationService');
const {
  scheduleEmptyCheck, markOccupied, cancelEmptyWatch, continueEmptyMeeting,
} = require('../services/emptyMeetingWatcher');
const { formatStoredTime } = require('../utils/dateTimeDisplay');
const {
  startSession, endSession, countOpenSessions, endAllSessions,
  getConferenceAttendance, getConferenceParticipantOverview, getJoinTimeReport,
} = require('../services/conferenceAttendanceService');

const getScheduledAt = (conference) => {
  const dateStr = String(conference.scheduled_date || '').slice(0, 10);
  const timePart = String(conference.scheduled_time || '00:00:00').slice(0, 8);
  const parsed = new Date(`${dateStr}T${timePart}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isAcceptWindowOpen = (conference, leadMinutes, now = Date.now()) => {
  const scheduledAt = getScheduledAt(conference);
  if (!scheduledAt) return true;
  return now >= scheduledAt.getTime() - leadMinutes * 60 * 1000;
};

/** Reception runs meetings day to day; admins keep the same control as their supervisor. */
const MEETING_HOST_ROLES = ['receptionist', 'admin', 'super_admin'];

const describeAcceptWindow = (leadMinutes) => (leadMinutes > 0
  ? `This meeting can be opened from ${leadMinutes} minute${leadMinutes === 1 ? '' : 's'} before the assigned time`
  : 'This meeting can be opened from the assigned time');

const JOIN_TIME_EXPORT_COLUMNS = [
  { key: 'patient_name', header: 'Patient', width: 22 },
  { key: 'conference_code', header: 'Conference ID', width: 16 },
  { key: 'meeting_date', header: 'Conference Date', width: 16 },
  { key: 'started_at', header: 'Start Time', width: 22 },
  { key: 'ended_at', header: 'End Time', width: 22 },
  { key: 'duration_label', header: 'Total Duration', width: 16 },
];

const conferenceFromClause = `
  FROM conferences c
  JOIN patients pat ON c.patient_id = pat.id
  LEFT JOIN gps gp ON c.gp_id = gp.id
  LEFT JOIN user_profiles gp_p ON gp.user_id = gp_p.user_id
  LEFT JOIN allied_health_professionals ahp ON c.ahp_id = ahp.id
  LEFT JOIN user_profiles ahp_p ON ahp.user_id = ahp_p.user_id
  LEFT JOIN users cb ON cb.id = c.created_by
  LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
`;

const conferenceSelectBase = `
  SELECT c.id, c.conference_code, c.appointment_id, c.patient_id, c.gp_id, c.ahp_id,
         DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
         TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
         c.status, c.cancelled_reason, c.cancelled_at, c.meeting_link, c.room_id, c.notes, c.accepted_at, c.accepted_by,
         c.ended_at, c.created_by, c.created_at, c.updated_at,
         c.record_meeting,
         (SELECT r.status FROM conference_recordings r WHERE r.conference_id = c.id ORDER BY r.id DESC LIMIT 1) AS recording_status,
         (SELECT r.id FROM conference_recordings r WHERE r.conference_id = c.id ORDER BY r.id DESC LIMIT 1) AS recording_id,
         TIME_FORMAT(c.accepted_at, '%H:%i:%s') AS started_time,
         TIME_FORMAT(c.ended_at, '%H:%i:%s') AS ended_time,
         CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
         CONCAT(gp_p.first_name, ' ', gp_p.last_name) AS gp_name,
         CONCAT(ahp_p.first_name, ' ', ahp_p.last_name) AS ahp_name,
         COALESCE(
           NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
           cb.username
         ) AS assigned_by_name,
         (
           SELECT GROUP_CONCAT(
             CONCAT(TRIM(CONCAT(cp_p.first_name, ' ', cp_p.last_name)), ' (', cp.role_in_conference, ')')
             ORDER BY cp.id SEPARATOR ', '
           )
           FROM conference_participants cp
           JOIN users cp_u ON cp.user_id = cp_u.id
           LEFT JOIN user_profiles cp_p ON cp_p.user_id = cp_u.id
           WHERE cp.conference_id = c.id AND cp.role_in_conference = 'ahp'
         ) AS ahp_participants,
         (
           SELECT GROUP_CONCAT(
             TRIM(CONCAT(cp_p.first_name, ' ', cp_p.last_name))
             ORDER BY cp.id SEPARATOR ', '
           )
           FROM conference_participants cp
           JOIN users cp_u ON cp.user_id = cp_u.id
           LEFT JOIN user_profiles cp_p ON cp_p.user_id = cp_u.id
           WHERE cp.conference_id = c.id AND cp.role_in_conference = 'gp'
         ) AS gp_participants
  ${conferenceFromClause}
`;

const applyRoleFilter = async (req, query, params) => {
  if (req.user.role === 'gp') {
    const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
    if (gpRows.length) {
      query += ` AND (
        c.gp_id = ?
        OR EXISTS (
          SELECT 1 FROM conference_participants cp
          WHERE cp.conference_id = c.id AND cp.user_id = ?
        )
      )`;
      params.push(gpRows[0].id, req.user.id);
    }
  }
  if (req.user.role === 'ahp') {
    const [ahpRows] = await pool.execute(
      'SELECT id FROM allied_health_professionals WHERE user_id = ?',
      [req.user.id]
    );
    if (ahpRows.length) {
      query += ` AND (
        c.ahp_id = ?
        OR EXISTS (
          SELECT 1 FROM conference_participants cp
          WHERE cp.conference_id = c.id AND cp.user_id = ?
        )
      )`;
      params.push(ahpRows[0].id, req.user.id);
    }
  }
  return query;
};

const wantsRecording = (conference) => parseBool(conference?.record_meeting);

const getConferenceById = async (id) => {
  await ensureRecordingSchema();
  const [rows] = await pool.execute(`${conferenceSelectBase} WHERE c.id = ?`, [id]);
  return videoService.withMeetingLink(rows[0] || null);
};

const getStaffContext = async (user) => {
  if (user.role === 'gp') {
    const [rows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [user.id]);
    return { gpId: rows[0]?.id || null, ahpId: null };
  }
  if (user.role === 'ahp') {
    const [rows] = await pool.execute(
      'SELECT id FROM allied_health_professionals WHERE user_id = ?',
      [user.id]
    );
    return { gpId: null, ahpId: rows[0]?.id || null };
  }
  return { gpId: null, ahpId: null };
};

const isAssignedParticipant = async (conference, user) => {
  const { gpId, ahpId } = await getStaffContext(user);
  if (user.role === 'gp') {
    if (conference.gp_id === gpId) return true;
    const [rows] = await pool.execute(
      'SELECT id FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conference.id, user.id]
    );
    return rows.length > 0;
  }
  if (user.role === 'ahp') {
    if (conference.ahp_id === ahpId) return true;
    const [rows] = await pool.execute(
      'SELECT id FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conference.id, user.id]
    );
    return rows.length > 0;
  }
  if (user.role === 'conference_guest') {
    const [rows] = await pool.execute(
      `SELECT id FROM conference_guest_access
       WHERE conference_id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [conference.id, user.id]
    );
    return rows.length > 0;
  }
  return ['receptionist', 'admin', 'super_admin'].includes(user.role);
};

const backfillMissingDocuments = async (req) => {
  let where = "WHERE c.status = 'completed'";
  const params = [];
  where = await applyRoleFilter(req, where, params);

  const [missing] = await pool.execute(
    `SELECT c.id
     FROM conferences c
     LEFT JOIN conference_generated_documents d ON d.conference_id = c.id
     ${where}
       AND d.id IS NULL
     ORDER BY c.scheduled_date DESC, c.scheduled_time DESC, c.id DESC
     LIMIT 15`,
    params
  );

  for (const row of missing) {
    try {
      await generateParticipantDocuments(row.id, { skipIfExists: true });
    } catch (err) {
      console.error(`Document backfill failed for conference ${row.id}:`, err.message);
    }
  }
};

exports.getAll = async (req, res, next) => {
  try {
    await ensureRecordingSchema();
    await processTimedOutConferences();
    const { search, status, date, date_scope, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    where = await applyRoleFilter(req, where, params);

    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (req.query.scope === 'history') {
      where += " AND c.status IN ('completed', 'cancelled')";
    }
    where = applyScheduledDateFilter(where, params, { date, date_scope });
    if (search) {
      where += ` AND (c.conference_code LIKE ? OR CONCAT(pat.first_name, ' ', pat.last_name) LIKE ?
        OR CONCAT(gp_p.first_name, ' ', gp_p.last_name) LIKE ? OR CONCAT(ahp_p.first_name, ' ', ahp_p.last_name) LIKE ?
        OR CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, '')) LIKE ?
        OR cb.username LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total ${conferenceFromClause} ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `${conferenceSelectBase} ${where}
       ORDER BY c.scheduled_date DESC, c.scheduled_time DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    res.json({
      success: true,
      data: videoService.withMeetingLinks(rows),
      pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

const conferenceScheduleBase = `${conferenceSelectBase}
  LEFT JOIN appointments ap ON c.appointment_id = ap.id`;

// Week starts Monday (mode 1) to match the clinical scheduling week.
const SCHEDULE_RANGES = {
  today: 'c.scheduled_date = CURDATE()',
  tomorrow: 'c.scheduled_date = CURDATE() + INTERVAL 1 DAY',
  week: 'YEARWEEK(c.scheduled_date, 1) = YEARWEEK(CURDATE(), 1)',
  month: 'YEAR(c.scheduled_date) = YEAR(CURDATE()) AND MONTH(c.scheduled_date) = MONTH(CURDATE())',
};

const applyScheduledDateFilter = (where, params, { date, date_scope }) => {
  if (SCHEDULE_RANGES[date_scope]) {
    return `${where} AND (${SCHEDULE_RANGES[date_scope]})`;
  }
  if (date) {
    params.push(date);
    return `${where} AND c.scheduled_date = ?`;
  }
  return where;
};

const ACTIVE_CARD_STATUSES = ['scheduled', 'waiting', 'live'];

const DOCUMENT_MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

exports.getSchedule = async (req, res, next) => {
  try {
    await ensureRecordingSchema();
    await processTimedOutConferences();
    const range = SCHEDULE_RANGES[req.query.range] ? req.query.range : 'today';
    let query = `${conferenceScheduleBase} WHERE (${SCHEDULE_RANGES[range]})
      AND c.status IN (${ACTIVE_CARD_STATUSES.map(() => '?').join(', ')})
      AND (c.appointment_id IS NULL OR ap.status IS NULL OR ap.status <> 'cancelled')`;
    const params = [...ACTIVE_CARD_STATUSES];

    query = await applyRoleFilter(req, query, params);
    query += ` ORDER BY
      CASE c.status WHEN 'live' THEN 0 WHEN 'waiting' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
      c.scheduled_date ASC, c.scheduled_time ASC`;
    const [rows] = await pool.execute(query, params);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ success: true, data: videoService.withMeetingLinks(rows), range });
  } catch (err) { next(err); }
};

exports.getDocuments = async (req, res, next) => {
  try {
    await backfillMissingDocuments(req);
    const { search, date, date_scope, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    where = await applyRoleFilter(req, where, params);
    where = applyScheduledDateFilter(where, params, { date, date_scope });
    where += ` AND d.file_type = 'pdf'
      AND d.id = (
        SELECT MAX(d2.id)
        FROM conference_generated_documents d2
        WHERE d2.conference_id = d.conference_id AND d2.file_type = 'pdf'
      )`;

    if (search) {
      const term = `%${search}%`;
      const codeMatch = String(search).trim().toUpperCase().match(/^DOC-?(\d+)$/);
      where += ` AND (c.conference_code LIKE ? OR d.original_name LIKE ?
        OR CONCAT(pat.first_name, ' ', pat.last_name) LIKE ?
        OR CAST(d.id AS CHAR) LIKE ?${codeMatch ? ' OR d.id = ?' : ''})`;
      params.push(term, term, term, term);
      if (codeMatch) params.push(parseInt(codeMatch[1], 10));
    }

    const fromClause = `
      FROM conference_generated_documents d
      JOIN conferences c ON c.id = d.conference_id
      JOIN patients pat ON pat.id = c.patient_id
      LEFT JOIN gps gp ON c.gp_id = gp.id
      LEFT JOIN user_profiles gp_p ON gp.user_id = gp_p.user_id
      LEFT JOIN users cb ON cb.id = c.created_by
      LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
    `;

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total ${fromClause} ${where}`,
      params
    );

    const listParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const [rows] = await pool.execute(
      `SELECT d.id AS file_id, d.original_name, d.file_size, d.file_type AS mime_type,
              d.created_at AS uploaded_at, d.participant_name,
              c.id AS conference_id, c.conference_code, c.status,
              DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
              TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
              CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
              CONCAT(gp_p.first_name, ' ', gp_p.last_name) AS gp_name,
              COALESCE(
                NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
                cb.username
              ) AS assigned_by_name,
              'generated' AS source
       ${fromClause} ${where}
       ORDER BY c.scheduled_date DESC, c.scheduled_time DESC, d.id DESC
       LIMIT ? OFFSET ?`,
      listParams
    );

    res.json({
      success: true,
      data: rows.map((row) => {
        let documentCode = `DOC-${row.file_id}`;
        try {
          documentCode = formatDocumentCode(row.file_id);
        } catch {
          /* keep fallback */
        }
        return { ...row, document_code: documentCode };
      }),
      pagination: { total: countRows[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

exports.viewGeneratedDocument = async (req, res, next) => {
  try {
    if (!(await assertClinicalDocumentDownload(req, res))) return;

    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      `SELECT d.original_name, d.stored_name, d.file_path, d.file_type
       FROM conference_generated_documents d
       JOIN conferences c ON c.id = d.conference_id
       WHERE d.id = ? AND c.id = ?`,
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const file = rows[0];
    const storedPath = String(file.file_path || '').replace(/\\/g, '/');
    const absolutePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.resolve(__dirname, '..', storedPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Document not found on disk' });
    }

    const mimeMap = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const mimeType = mimeMap[file.file_type] || 'application/octet-stream';
    const documentCode = formatDocumentCode(fileId);
    const safeName = `${documentCode}.pdf`.replace(/"/g, '');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

exports.viewDocument = async (req, res, next) => {
  try {
    if (!(await assertClinicalDocumentDownload(req, res))) return;

    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      `SELECT f.original_name, f.stored_name, f.file_path, f.mime_type
       FROM appointment_files f
       JOIN conferences c ON c.appointment_id = f.appointment_id
       WHERE f.id = ? AND c.id = ?`,
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const file = rows[0];
    const absolutePath = path.isAbsolute(file.file_path)
      ? file.file_path
      : path.join(__dirname, '..', file.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'Document not found on disk' });
    }

    const extension = path.extname(file.original_name || file.stored_name || '').toLowerCase();
    const mimeType = file.mime_type || DOCUMENT_MIME_BY_EXT[extension] || 'application/octet-stream';
    const safeName = String(file.original_name || file.stored_name || 'document').replace(/"/g, '');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeName}"`);
    res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

const EXPORT_COLUMNS = [
  { key: 'conference_code', header: 'Conference ID', width: 16 },
  { key: 'patient_name', header: 'Patient', width: 24 },
  { key: 'gp_name', header: 'GP', width: 22 },
  { key: 'ahp_name', header: 'AHP', width: 22 },
  { key: 'scheduled_date', header: 'Date', width: 14 },
  { key: 'scheduled_time', header: 'Time', width: 12 },
  { key: 'status', header: 'Status', width: 14 },
];

exports.exportReport = async (req, res, next) => {
  try {
    const { format = 'csv', status, start_date, end_date, search, patient_id, patient } = req.query;

    let query = `${conferenceSelectBase} WHERE 1=1`;
    const params = [];

    query = await applyRoleFilter(req, query, params);

    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (start_date) { query += ' AND c.scheduled_date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND c.scheduled_date <= ?'; params.push(end_date); }
    if (patient_id) {
      const patientId = parseInt(patient_id, 10);
      if (!Number.isNaN(patientId)) {
        query += ' AND c.patient_id = ?';
        params.push(patientId);
      }
    }
    const patientQuery = String(patient || (!patient_id ? search : '') || '').trim();
    if (patientQuery && !patient_id) {
      const term = `%${patientQuery}%`;
      const exactId = parseInt(patientQuery, 10);
      const idMatch = !Number.isNaN(exactId) && String(exactId) === patientQuery;
      query += ` AND (
        CONCAT(pat.first_name, ' ', pat.last_name) LIKE ?
        OR pat.first_name LIKE ?
        OR pat.last_name LIKE ?
        OR pat.patient_code LIKE ?
        OR CAST(pat.id AS CHAR) LIKE ?
        OR c.conference_code LIKE ?
        ${idMatch ? 'OR c.patient_id = ?' : ''}
      )`;
      params.push(term, term, term, term, term, term);
      if (idMatch) params.push(exactId);
    }

    query += ' ORDER BY c.scheduled_date DESC, c.scheduled_time DESC';
    const [rows] = await pool.execute(query, params);

    const formatted = rows.map((row) => ({
      ...row,
      gp_name: (row.gp_participants || (row.gp_name || '').trim() || 'Unassigned'),
      ahp_name: (row.ahp_participants || (row.ahp_name || '').trim() || 'Unassigned'),
      status: String(row.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    const range = start_date || end_date
      ? `${start_date || 'Earliest'} to ${end_date || 'Latest'}`
      : 'All dates';
    const patientLabel = patient_id
      ? (formatted[0]?.patient_name || `Patient ${patient_id}`)
      : (patientQuery || 'All patients');

    const { buffer, mimeType, fileName } = await buildExport(format, {
      columns: EXPORT_COLUMNS,
      rows: formatted,
      title: 'Conference Meetings Report',
      subtitle: `${range} • ${patientLabel} • ${formatted.length} record(s) • Generated ${new Date().toLocaleString()}`,
      fileName: `conference-report-${new Date().toISOString().slice(0, 10)}`,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'export',
      entityType: 'conference',
      details: { format, status: status || 'all', start_date, end_date, patient_id: patient_id || 'all', patient: patientQuery || undefined, count: formatted.length },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    res.json({ success: true, data: conference });
  } catch (err) { next(err); }
};

exports.getClinicalContext = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }

    let patientPreviousRecords = '';
    let internalNotes = '';
    let conferenceNote = '';
    let files = [];

    if (conference.appointment_id) {
      const [apptRows] = await pool.execute(
        `SELECT patient_previous_records, notes, important_note
         FROM appointments WHERE id = ?`,
        [conference.appointment_id]
      );
      const appointment = apptRows[0] || {};
      patientPreviousRecords = appointment.patient_previous_records || '';
      internalNotes = appointment.notes || '';
      conferenceNote = appointment.important_note || '';

      const [fileRows] = await pool.execute(
        `SELECT id, original_name, file_size, mime_type, created_at
         FROM appointment_files WHERE appointment_id = ? ORDER BY id`,
        [conference.appointment_id]
      );
      files = fileRows;
    }

    const [patientRows] = await pool.execute(
      'SELECT medical_history FROM patients WHERE id = ?',
      [conference.patient_id]
    );

    const [previousRows] = await pool.execute(
      `SELECT d.id AS file_id, d.original_name, d.file_size,
              c.id AS conference_id, c.conference_code,
              DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date
       FROM conference_generated_documents d
       JOIN conferences c ON c.id = d.conference_id
       WHERE c.patient_id = ? AND c.id <> ? AND d.file_type = 'pdf'
         AND d.id = (
           SELECT MAX(d2.id)
           FROM conference_generated_documents d2
           WHERE d2.conference_id = d.conference_id AND d2.file_type = 'pdf'
         )
       ORDER BY c.scheduled_date DESC, d.id DESC
       LIMIT 20`,
      [conference.patient_id, conference.id]
    );

    res.json({
      success: true,
      data: {
        patient_previous_records: patientPreviousRecords,
        medical_history: patientRows[0]?.medical_history || '',
        internal_notes: internalNotes,
        conference_note: conferenceNote,
        conference_notes: conference.notes || '',
        files,
        previous_records: previousRows.map((row) => {
          let documentCode = `DOC-${row.file_id}`;
          try {
            documentCode = formatDocumentCode(row.file_id);
          } catch {
            /* keep fallback */
          }
          return { ...row, document_code: documentCode };
        }),
      },
    });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { patient_id, gp_id, ahp_id, scheduled_date, scheduled_time, meeting_link, notes } = req.body;

    await ensureConferenceSequence(conn);
    await conn.beginTransaction();
    const conferenceCode = await allocateConferenceCode(conn);
    const link = meeting_link || videoService.buildMeetingLink(conferenceCode);

    const [result] = await conn.execute(
      `INSERT INTO conferences (conference_code, patient_id, gp_id, ahp_id, scheduled_date, scheduled_time, meeting_link, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [conferenceCode, patient_id, gp_id || null, ahp_id || null, scheduled_date, scheduled_time, link, notes, req.user.id]
    );

    const participantIds = [];
    if (gp_id) {
      const [gpUser] = await conn.execute('SELECT user_id FROM gps WHERE id = ?', [gp_id]);
      if (gpUser.length) participantIds.push({ userId: gpUser[0].user_id, role: 'gp' });
    }
    if (ahp_id) {
      const [ahpUser] = await conn.execute('SELECT user_id FROM allied_health_professionals WHERE id = ?', [ahp_id]);
      if (ahpUser.length) participantIds.push({ userId: ahpUser[0].user_id, role: 'ahp' });
    }

    for (const p of participantIds) {
      await conn.execute(
        'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
        [result.insertId, p.userId, p.role]
      );
      await createNotification({
        userId: p.userId,
        title: 'Conference Created',
        message: `You are invited to conference ${conferenceCode}`,
        type: 'conference',
      }, conn);
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Conference created', data: { id: result.insertId, conference_code: conferenceCode } });
    emitScheduleChanged({ type: 'conference-created', conferenceId: result.insertId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.update = async (req, res, next) => {
  try {
    const fields = ['patient_id', 'gp_id', 'ahp_id', 'scheduled_date', 'scheduled_time', 'status', 'meeting_link', 'notes'];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update' });

    if (req.body.status === 'live') {
      await notifyConferenceParticipants(req.params.id, {
        title: 'Conference Started',
        message: 'A conference has started',
        type: 'conference',
      });
    }

    values.push(req.params.id);
    await pool.execute(`UPDATE conferences SET ${updates.join(', ')} WHERE id = ?`, values);

    if (req.body.status === 'completed') {
      try {
        await generateParticipantDocuments(req.params.id, { skipIfExists: true });
      } catch (docErr) {
        console.error('Document generation failed:', docErr.message);
      }
    }

    res.json({ success: true, message: 'Conference updated' });
    emitScheduleChanged({ type: 'conference-updated', conferenceId: Number(req.params.id) });
  } catch (err) { next(err); }
};

exports.accept = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (!MEETING_HOST_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only reception or an administrator can open this meeting' });
    }
    if (['completed', 'cancelled'].includes(conference.status)) {
      return res.status(400).json({ success: false, message: 'This conference is no longer available' });
    }
    if (['waiting', 'live'].includes(conference.status)) {
      return res.json({
        success: true,
        message: 'Meeting already opened',
        data: { status: conference.status, record_meeting: wantsRecording(conference) },
      });
    }

    const leadMinutes = await getNumericSetting('conference_open_lead_minutes');
    if (!isAcceptWindowOpen(conference, leadMinutes)) {
      return res.status(400).json({
        success: false,
        message: describeAcceptWindow(leadMinutes),
      });
    }

    await pool.execute(
      `UPDATE conferences SET status = 'waiting', accepted_at = NOW(), accepted_by = ? WHERE id = ?`,
      [req.user.id, conference.id]
    );

    await ensureReportRows(conference.id);

    await notifyConferenceParticipants(conference.id, {
      title: 'Meeting Open',
      message: `${req.user.role === 'admin' ? 'An administrator' : 'Reception'} has opened conference ${conference.conference_code}. You can now join.`,
      type: 'conference',
    });

    if (wantsRecording(conference)) {
      try {
        await startRecording(conference.id);
      } catch (err) {
        console.error('[recording]', err.message);
        return res.status(500).json({
          success: false,
          message: 'Meeting could not start recording. Check recording storage and try again.',
        });
      }
    }

    res.json({
      success: true,
      message: wantsRecording(conference)
        ? 'Meeting opened and recording started'
        : 'Meeting opened — GP, AHP, and guests can now join',
      data: { status: 'waiting', record_meeting: wantsRecording(conference) },
    });
    emitScheduleChanged({ type: 'meeting-opened', conferenceId: conference.id });
    scheduleEmptyCheck(conference.id).catch((err) => console.error('[empty-meeting]', err.message));
  } catch (err) { next(err); }
};

exports.join = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (conference.status === 'completed' || conference.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This conference has ended' });
    }

    const isHost = MEETING_HOST_ROLES.includes(req.user.role);
    if (isHost) {
      return res.status(403).json({
        success: false,
        message: 'Reception opens and ends meetings. Only GP, AHP, and guests join the video room.',
      });
    }
    if (!['gp', 'ahp', 'conference_guest'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only clinical staff can join meetings' });
    }

    if (!isHost) {
      const assigned = await isAssignedParticipant(conference, req.user);
      if (!assigned) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this conference' });
      }
    }

    if (!['waiting', 'live'].includes(conference.status)) {
      return res.status(403).json({
        success: false,
        message: 'Reception has not opened this meeting yet',
      });
    }

    const room = await videoService.ensureRoom(conference.conference_code, {
      recordMeeting: wantsRecording(conference),
    });
    const iceServers = videoService.getIceServers();
    const [profile] = await pool.execute(
      'SELECT first_name, last_name FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const displayName = profile.length
      ? `${profile[0].first_name} ${profile[0].last_name}`.trim()
      : req.user.role.toUpperCase();

    if (conference.status !== 'live') {
      await pool.execute(
        `UPDATE conferences SET status = 'live', room_id = ? WHERE id = ?`,
        [room.roomId, conference.id]
      );
    }

    await ensureReportRows(conference.id);

    if (!isHost) {
      await pool.execute(
        'UPDATE conference_participants SET joined_at = COALESCE(joined_at, NOW()) WHERE conference_id = ? AND user_id = ?',
        [conference.id, req.user.id]
      );
      await startSession(conference.id, req.user.id);
    }
    markOccupied(conference.id);
    emitScheduleChanged({ type: 'meeting-joined', conferenceId: conference.id });
    if (wantsRecording(conference)) {
      try {
        await startRecording(conference.id);
      } catch (err) {
        console.error('[recording]', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        provider: room.provider,
        roomId: room.roomId,
        jitsiUrl: room.jitsiUrl,
        jitsiDomain: room.jitsiDomain,
        iceServers: room.provider === 'jitsi' ? [] : iceServers,
        displayName,
        patientName: conference.patient_name || '',
        recordMeeting: wantsRecording(conference),
        conference: {
          id: conference.id,
          status: 'live',
          conference_code: conference.conference_code,
          patient_name: conference.patient_name || '',
          record_meeting: wantsRecording(conference),
        },
      },
    });
  } catch (err) { next(err); }
};

exports.leave = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    const isHost = MEETING_HOST_ROLES.includes(req.user.role);
    if (!isHost && !['gp', 'ahp', 'conference_guest'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only meeting participants can leave' });
    }

    if (!isHost) {
      await endSession(conference.id, req.user.id);
      await pool.execute(
        'UPDATE conference_participants SET left_at = NOW() WHERE conference_id = ? AND user_id = ?',
        [conference.id, req.user.id]
      );
    }

    res.json({ success: true, message: 'Left meeting — join time recorded' });
    scheduleEmptyCheck(conference.id).catch((err) => console.error('[empty-meeting]', err.message));
  } catch (err) { next(err); }
};

exports.getParticipants = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (!(await isAssignedParticipant(conference, req.user))) {
      return res.status(403).json({ success: false, message: 'You cannot view this conference' });
    }

    const overview = await getConferenceParticipantOverview(conference.id);
    res.json({
      success: true,
      data: {
        conference_code: conference.conference_code,
        patient_name: conference.patient_name,
        assigned_by_name: conference.assigned_by_name,
        scheduled_date: conference.scheduled_date,
        started_time: conference.started_time,
        ended_time: conference.ended_time,
        accepted_at: conference.accepted_at,
        ended_at: conference.ended_at,
        status: conference.status,
        ...overview,
      },
    });
  } catch (err) { next(err); }
};

exports.getAttendance = async (req, res, next) => {
  try {
    if (!['receptionist', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Attendance data is restricted to staff' });
    }

    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }

    const attendance = await getConferenceAttendance(conference.id);
    res.json({
      success: true,
      data: {
        ...attendance,
        conference_code: conference.conference_code,
        patient_name: conference.patient_name,
        scheduled_date: conference.scheduled_date,
        scheduled_time: conference.scheduled_time,
        started_time: conference.started_time,
        ended_time: conference.ended_time,
        accepted_at: conference.accepted_at,
        ended_at: conference.ended_at,
        status: conference.status,
      },
    });
  } catch (err) { next(err); }
};

exports.end = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (!MEETING_HOST_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only reception or an administrator can end this meeting' });
    }
    if (['completed', 'cancelled'].includes(conference.status)) {
      return res.status(400).json({ success: false, message: 'This conference has already ended' });
    }
    if (!['waiting', 'live'].includes(conference.status)) {
      return res.status(400).json({ success: false, message: 'Open the meeting before ending it' });
    }

    const stillIn = await countOpenSessions(conference.id);
    const force = Boolean(req.body?.force);
    if (stillIn > 0 && !force) {
      return res.status(409).json({
        success: false,
        code: 'PARTICIPANTS_STILL_IN',
        message: `${stillIn} participant${stillIn === 1 ? ' is' : 's are'} still in the meeting. Wait until everyone leaves, or confirm to end now.`,
        data: { still_in_meeting: stillIn },
      });
    }

    if (wantsRecording(conference)) {
      emitRecordingFlush(conference.id);
      await waitForRecordingData(conference.id).catch((err) => console.error('[recording]', err.message));
    }

    await pool.execute(
      `UPDATE conferences SET status = 'completed', ended_at = NOW(), room_id = NULL WHERE id = ?`,
      [conference.id]
    );

    await endAllSessions(conference.id);
    await pool.execute(
      `UPDATE conference_participants SET left_at = COALESCE(left_at, NOW()) WHERE conference_id = ?`,
      [conference.id]
    );

    await finalizeRecording(conference.id).catch((err) => console.error('[recording]', err.message));

    await lockReportsAfterMeeting(conference.id);

    try {
      await generateParticipantDocuments(conference.id, { skipIfExists: true });
    } catch (docErr) {
      console.error('Document generation failed:', docErr.message);
    }

    await notifyConferenceParticipants(conference.id, {
      title: 'Conference Ended',
      message: `Meeting ${conference.conference_code} ended — clinical documents are ready`,
      type: 'conference',
    });

    emitConferenceEnded(conference.id);
    cancelEmptyWatch(conference.id);

    res.json({ success: true, message: 'Meeting ended and documents generated' });
  } catch (err) { next(err); }
};

exports.continueEmpty = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (!MEETING_HOST_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only reception or an administrator can continue this meeting' });
    }
    if (!['waiting', 'live'].includes(conference.status)) {
      return res.status(400).json({ success: false, message: 'This meeting is not open' });
    }

    await continueEmptyMeeting(conference.id);
    res.json({ success: true, message: 'Meeting kept open — you will be asked again if it stays empty' });
  } catch (err) { next(err); }
};

exports.getJoinTimeReport = async (req, res, next) => {
  try {
    if (!['receptionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Join time report is restricted to receptionist and admin' });
    }

    const report = await getJoinTimeReport({
      date: req.query.date,
      patient_id: req.query.patient_id || null,
      role: req.query.role || null,
      gp_id: req.query.gp_id || null,
      ahp_id: req.query.ahp_id || null,
    });

    res.json({ success: true, data: report });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.exportJoinTimeReport = async (req, res, next) => {
  try {
    if (!['receptionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Join time report is restricted to receptionist and admin' });
    }

    const format = req.query.format || 'csv';
    const report = await getJoinTimeReport({
      date: req.query.date,
      patient_id: req.query.patient_id || null,
      role: req.query.role || null,
      gp_id: req.query.gp_id || null,
      ahp_id: req.query.ahp_id || null,
    });

    const { date, patient_id, role, gp_id, ahp_id } = report.filters;
    const filterParts = [`Date: ${date}`];
    if (patient_id) filterParts.push(`Patient ID: ${patient_id}`);
    if (role) filterParts.push(`Role: ${String(role).toUpperCase()}`);
    if (gp_id) filterParts.push(`GP ID: ${gp_id}`);
    if (ahp_id) filterParts.push(`AHP ID: ${ahp_id}`);

    const timezone = (await getStringSetting('timezone', 'Asia/Colombo')) || 'Asia/Colombo';
    const exportRows = report.rows.map((row) => ({
      patient_name: row.patient_name,
      conference_code: row.conference_code,
      meeting_date: row.meeting_date,
      started_at: formatStoredTime(row.started_at || row.started_time, timezone),
      ended_at: formatStoredTime(row.ended_at || row.ended_time, timezone),
      duration_label: row.duration_label,
    }));

    const { buffer, mimeType, fileName } = await buildExport(format, {
      columns: JOIN_TIME_EXPORT_COLUMNS,
      rows: exportRows,
      title: 'Participant Join Time Report',
      subtitle: `${filterParts.join(' · ')} · Meeting time total: ${report.summary.grand_total_label} · ${exportRows.length} conference(s)`,
      fileName: `join-time-report-${date}`,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'export',
      entityType: 'conference_join_time',
      details: { format, ...report.filters, count: exportRows.length },
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM conferences WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Conference deleted' });
    emitScheduleChanged({ type: 'conference-deleted', conferenceId: Number(req.params.id) });
  } catch (err) { next(err); }
};
