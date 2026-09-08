const fs = require('fs');
const pool = require('../config/db');
const { ensureAppointmentSequence, allocateAppointmentCode } = require('../utils/appointmentId');
const path = require('path');
const { uploadDir } = require('../config/jwt');
const { syncConferenceFromAppointment, cancelConferenceForAppointment, deleteConferenceForAppointment } = require('../services/conferenceSync');
const { processTimedOutConferences } = require('../services/conferenceTimeoutService');
const { parseArrayField, parseGpIds } = require('../utils/appointmentAssignments');
const { emitScheduleChanged } = require('../services/socketService');
const { hasPermission } = require('../services/receptionistPermissionService');
const { ensureSchema: ensureRecordingSchema, parseBool } = require('../services/conferenceRecordingService');

const parseAhpAssignments = parseArrayField;

const resolveRecordMeeting = async (req, { required = false } = {}) => {
  await ensureRecordingSchema();
  if (req.body.record_meeting === undefined && !required) return null;
  const requested = parseBool(req.body.record_meeting);
  if (requested && req.user.role === 'receptionist') {
    const allowed = await hasPermission(req.user.id, 'conference_record');
    if (!allowed) {
      const err = new Error('You do not have permission to record meetings');
      err.status = 403;
      throw err;
    }
  }
  if (requested && !['receptionist', 'admin', 'super_admin'].includes(req.user.role)) {
    return 0;
  }
  return requested ? 1 : 0;
};

const replaceGpAssignments = async (conn, appointmentId, gpIds) => {
  await conn.execute('DELETE FROM appointment_gps WHERE appointment_id = ?', [appointmentId]);
  for (const gpId of gpIds) {
    await conn.execute(
      'INSERT INTO appointment_gps (appointment_id, gp_id) VALUES (?, ?)',
      [appointmentId, gpId]
    );
  }
};

const validateAhpAssignments = (assignments) => {
  const seenPairs = new Set();
  const seenAhps = new Set();
  for (const item of assignments) {
    if (!item.profession || !item.ahp_id) {
      return 'Each AHP row must have both profession and AHP selected';
    }
    const ahpId = String(item.ahp_id);
    if (seenAhps.has(ahpId)) {
      return 'The same AHP cannot be added twice in one appointment';
    }
    seenAhps.add(ahpId);
    const key = `${String(item.profession).trim().toLowerCase()}::${ahpId}`;
    if (seenPairs.has(key)) {
      return 'The same profession and AHP cannot be added twice in one appointment';
    }
    seenPairs.add(key);
  }
  return null;
};

const DATE_SCOPES = {
  today: 'a.appointment_date = CURDATE()',
  tomorrow: 'a.appointment_date = CURDATE() + INTERVAL 1 DAY',
  week: 'YEARWEEK(a.appointment_date, 1) = YEARWEEK(CURDATE(), 1)',
  month: 'YEAR(a.appointment_date) = YEAR(CURDATE()) AND MONTH(a.appointment_date) = MONTH(CURDATE())',
  year: 'YEAR(a.appointment_date) = YEAR(CURDATE())',
};

const appointmentSelectBase = `
  SELECT a.*,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.patient_code,
    DATE_FORMAT(p.dob, '%Y-%m-%d') AS patient_dob,
    CONCAT(gp_p.first_name, ' ', gp_p.last_name) AS gp_name,
    g.gp_code,
    (
      SELECT GROUP_CONCAT(
        TRIM(CONCAT(COALESCE(a_gp_p.first_name, ''), ' ', COALESCE(a_gp_p.last_name, '')))
        ORDER BY ag.id SEPARATOR '; '
      )
      FROM appointment_gps ag
      JOIN gps a_gp ON ag.gp_id = a_gp.id
      JOIN users a_gp_u ON a_gp.user_id = a_gp_u.id
      LEFT JOIN user_profiles a_gp_p ON a_gp_p.user_id = a_gp_u.id
      WHERE ag.appointment_id = a.id
    ) AS gp_summary,
    (
      SELECT GROUP_CONCAT(
        CONCAT(aa.profession, ': ', TRIM(CONCAT(ahp_p.first_name, ' ', ahp_p.last_name)))
        ORDER BY aa.id SEPARATOR '; '
      )
      FROM appointment_ahps aa
      JOIN allied_health_professionals ah ON aa.ahp_id = ah.id
      JOIN users ah_u ON ah.user_id = ah_u.id
      LEFT JOIN user_profiles ahp_p ON ahp_p.user_id = ah_u.id
      WHERE aa.appointment_id = a.id
    ) AS ahp_summary,
    COALESCE(
      NULLIF(TRIM(CONCAT(COALESCE(cb_p.first_name, ''), ' ', COALESCE(cb_p.last_name, ''))), ''),
      cb.username
    ) AS assigned_by_name
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  LEFT JOIN gps g ON a.gp_id = g.id
  LEFT JOIN users gp_u ON g.user_id = gp_u.id
  LEFT JOIN user_profiles gp_p ON gp_p.user_id = gp_u.id
  LEFT JOIN users cb ON cb.id = a.created_by
  LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
`;

const fetchLinkedConference = async (appointmentId) => {
  const [rows] = await pool.execute(
    `SELECT c.id, c.conference_code, c.appointment_id,
      DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
      TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
      c.status, c.cancelled_reason, c.cancelled_at, c.meeting_link, c.room_id,
      c.notes, c.accepted_at, c.accepted_by,
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
        WHERE cp.conference_id = c.id
      ) AS participants
     FROM conferences c
     JOIN patients pat ON c.patient_id = pat.id
     LEFT JOIN gps gp ON c.gp_id = gp.id
     LEFT JOIN user_profiles gp_p ON gp.user_id = gp_p.user_id
     LEFT JOIN allied_health_professionals ahp ON c.ahp_id = ahp.id
     LEFT JOIN user_profiles ahp_p ON ahp.user_id = ahp_p.user_id
     LEFT JOIN users cb ON cb.id = c.created_by
     LEFT JOIN user_profiles cb_p ON cb_p.user_id = cb.id
     WHERE c.appointment_id = ?
     ORDER BY c.id DESC LIMIT 1`,
    [appointmentId]
  );
  return rows[0] || null;
};

const fetchAppointmentDetails = async (id) => {
  const [rows] = await pool.execute(`${appointmentSelectBase} WHERE a.id = ?`, [id]);
  if (!rows.length) return null;

  const [gpRows] = await pool.execute(
    `SELECT ag.gp_id, g.gp_code,
       TRIM(CONCAT(COALESCE(gp_p.first_name, ''), ' ', COALESCE(gp_p.last_name, ''))) AS gp_name
     FROM appointment_gps ag
     JOIN gps g ON ag.gp_id = g.id
     LEFT JOIN user_profiles gp_p ON gp_p.user_id = g.user_id
     WHERE ag.appointment_id = ? ORDER BY ag.id`,
    [id]
  );
  const [ahpRows] = await pool.execute(
    'SELECT id, profession, ahp_id FROM appointment_ahps WHERE appointment_id = ? ORDER BY id',
    [id]
  );
  const [fileRows] = await pool.execute(
    'SELECT id, original_name, stored_name, file_path, file_size, mime_type, created_at FROM appointment_files WHERE appointment_id = ? ORDER BY id',
    [id]
  );

  const gpAssignments = gpRows.length
    ? gpRows
    : (rows[0].gp_id ? [{ gp_id: rows[0].gp_id, gp_code: rows[0].gp_code, gp_name: rows[0].gp_name }] : []);

  const conference = await fetchLinkedConference(id);
  let guests = [];
  if (conference?.id) {
    try {
      const [guestRows] = await pool.execute(
        `SELECT guest_name, guest_role
         FROM conference_guest_access
         WHERE conference_id = ? AND revoked_at IS NULL
         ORDER BY id`,
        [conference.id]
      );
      guests = guestRows.map((row) => ({
        ...row,
        label: row.guest_role
          ? `${row.guest_name} (${String(row.guest_role).replace(/_/g, ' ')})`
          : row.guest_name,
      }));
    } catch {
      guests = [];
    }
  }

  return {
    ...rows[0],
    gp_assignments: gpAssignments,
    gp_ids: gpAssignments.map((g) => g.gp_id),
    ahp_assignments: ahpRows,
    files: fileRows.map((f) => ({
      ...f,
      url: `/uploads/${path.basename(f.file_path)}`,
    })),
    conference,
    guests,
    guest_summary: guests.map((g) => g.label).filter(Boolean).join('; ') || null,
  };
};

exports.getAll = async (req, res, next) => {
  try {
    await processTimedOutConferences();
    const { search, date, date_scope, status, gp_id, assigned_by, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `${appointmentSelectBase} WHERE 1=1`;
    const params = [];
    if (DATE_SCOPES[date_scope]) {
      query += ` AND (${DATE_SCOPES[date_scope]})`;
    } else if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (gp_id) {
      query += ` AND (
        a.gp_id = ?
        OR EXISTS (SELECT 1 FROM appointment_gps ag WHERE ag.appointment_id = a.id AND ag.gp_id = ?)
      )`;
      params.push(gp_id, gp_id);
    }
    if (assigned_by) { query += ' AND a.created_by = ?'; params.push(assigned_by); }
    if (req.query.scope === 'records') {
      query += ` AND (
        a.status = 'cancelled'
        OR (
          a.status IN ('scheduled', 'confirmed')
          AND (
            a.appointment_date > CURDATE()
            OR (a.appointment_date = CURDATE() AND a.appointment_time >= CURTIME())
          )
        )
      )`;
    }
    if (search) {
      query += ` AND (
        CONCAT(p.first_name, ' ', p.last_name) LIKE ?
        OR a.title LIKE ?
        OR a.appointment_code LIKE ?
        OR a.important_note LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const [countResult] = await pool.execute(
      query.replace(/SELECT a\.\*.*FROM appointments a/s, 'SELECT COUNT(*) as total FROM appointments a'),
      params
    );
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    const [assignerRows] = await pool.execute(`
      SELECT DISTINCT a.created_by AS id,
        COALESCE(
          NULLIF(TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))), ''),
          u.username,
          u.email
        ) AS name
      FROM appointments a
      JOIN users u ON u.id = a.created_by
      LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY name
    `);
    res.json({
      success: true,
      data: rows,
      assigners: assignerRows,
      pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    await processTimedOutConferences();
    const appointment = await fetchAppointmentDetails(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, data: appointment });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const {
      patient_id,
      appointment_date,
      appointment_time,
      title,
      important_note,
      patient_previous_records,
      notes,
      status = 'scheduled',
    } = req.body;

    const ahpAssignments = parseAhpAssignments(req.body.ahp_assignments);
    const ahpError = validateAhpAssignments(ahpAssignments);
    if (ahpError) {
      return res.status(400).json({ success: false, message: ahpError });
    }

    const gpIds = parseGpIds(req.body);
    if (!patient_id || !gpIds.length || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'Patient, at least one GP, and title are required' });
    }

    const recordMeeting = await resolveRecordMeeting(req, { required: true });

    await ensureAppointmentSequence(conn);
    await conn.beginTransaction();
    const appointmentCode = await allocateAppointmentCode(conn);
    const firstAhpId = ahpAssignments.length ? ahpAssignments[0].ahp_id : null;

    const [result] = await conn.execute(
      `INSERT INTO appointments (
        appointment_code, patient_id, gp_id, ahp_id, title, important_note,
        patient_previous_records, appointment_date, appointment_time, status, notes, created_by,
        record_meeting
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentCode,
        Number(patient_id),
        gpIds[0],
        firstAhpId,
        title.trim(),
        important_note || null,
        patient_previous_records || null,
        appointment_date,
        appointment_time,
        status,
        notes || null,
        req.user.id,
        recordMeeting,
      ]
    );

    const appointmentId = result.insertId;

    await replaceGpAssignments(conn, appointmentId, gpIds);

    for (const assignment of ahpAssignments) {
      await conn.execute(
        'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
        [appointmentId, assignment.profession, assignment.ahp_id]
      );
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await conn.execute(
          `INSERT INTO appointment_files (appointment_id, original_name, stored_name, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            appointmentId,
            file.originalname,
            file.filename,
            path.join(uploadDir, file.filename).replace(/\\/g, '/'),
            file.size,
            file.mimetype,
            req.user.id,
          ]
        );
      }
    }

    await syncConferenceFromAppointment(conn, appointmentId, req.user.id);

    await conn.commit();
    const created = await fetchAppointmentDetails(appointmentId);
    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: created });
    emitScheduleChanged({ type: 'appointment-created', appointmentId });
    setImmediate(() => {
      const { notifyAppointmentCreated } = require('../services/adminNotificationService');
      notifyAppointmentCreated(created);
    });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Duplicate profession and AHP combination not allowed' });
    }
    next(err);
  } finally {
    conn.release();
  }
};

exports.update = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const [existing] = await conn.execute('SELECT id FROM appointments WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const ahpAssignments = req.body.ahp_assignments !== undefined
      ? parseAhpAssignments(req.body.ahp_assignments)
      : null;
    if (ahpAssignments) {
      const ahpError = validateAhpAssignments(ahpAssignments);
      if (ahpError) {
        return res.status(400).json({ success: false, message: ahpError });
      }
    }

    const gpIds = req.body.gp_ids !== undefined ? parseGpIds(req.body) : null;
    if (gpIds && !gpIds.length) {
      return res.status(400).json({ success: false, message: 'At least one GP is required' });
    }

    const recordMeeting = await resolveRecordMeeting(req);

    await conn.beginTransaction();

    const fields = [
      'patient_id', 'appointment_date', 'appointment_time', 'status',
      'title', 'important_note', 'patient_previous_records', 'notes',
      'cancelled_reason',
      ...(gpIds ? [] : ['gp_id']),
    ];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f] === '' ? null : req.body[f]);
      }
    });

    if (recordMeeting !== null) {
      updates.push('record_meeting = ?');
      values.push(recordMeeting);
    }

    if (gpIds) {
      updates.push('gp_id = ?');
      values.push(gpIds[0]);
      await replaceGpAssignments(conn, id, gpIds);
    }

    if (ahpAssignments) {
      const firstAhpId = ahpAssignments.length ? ahpAssignments[0].ahp_id : null;
      updates.push('ahp_id = ?');
      values.push(firstAhpId);
      await conn.execute('DELETE FROM appointment_ahps WHERE appointment_id = ?', [id]);
      for (const assignment of ahpAssignments) {
        await conn.execute(
          'INSERT INTO appointment_ahps (appointment_id, profession, ahp_id) VALUES (?, ?, ?)',
          [id, assignment.profession, assignment.ahp_id]
        );
      }
    }

    if (updates.length) {
      values.push(id);
      await conn.execute(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (req.files?.length) {
      for (const file of req.files) {
        await conn.execute(
          `INSERT INTO appointment_files (appointment_id, original_name, stored_name, file_path, file_size, mime_type, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            file.originalname,
            file.filename,
            path.join(uploadDir, file.filename).replace(/\\/g, '/'),
            file.size,
            file.mimetype,
            req.user.id,
          ]
        );
      }
    }

    await syncConferenceFromAppointment(conn, id, req.user.id);
    if (req.body.status === 'cancelled') {
      await cancelConferenceForAppointment(conn, id, req.body.cancelled_reason || null);
    }

    await conn.commit();
    const updated = await fetchAppointmentDetails(id);
    res.json({ success: true, message: 'Appointment updated', data: updated });
    emitScheduleChanged({ type: 'appointment-updated', appointmentId: Number(id) });
    if (req.body.status === 'cancelled') {
      setImmediate(() => {
        const { notifyAppointmentCancelled } = require('../services/adminNotificationService');
        notifyAppointmentCancelled({
          ...updated,
          cancelled_reason: req.body.cancelled_reason || updated.cancelled_reason,
        });
      });
    }
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Duplicate profession and AHP combination not allowed' });
    }
    next(err);
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await deleteConferenceForAppointment(conn, req.params.id);
    await conn.execute('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.json({ success: true, message: 'Appointment deleted' });
    emitScheduleChanged({ type: 'appointment-deleted', appointmentId: Number(req.params.id) });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

const MIME_BY_EXT = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const resolveFilePath = (filePath) => {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(__dirname, '..', filePath);
};

const resolveMimeType = (file) => {
  if (file.mime_type) return file.mime_type;
  const ext = path.extname(file.original_name || file.stored_name || '').toLowerCase();
  return MIME_BY_EXT[ext] || 'application/octet-stream';
};

exports.viewFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      `SELECT f.original_name, f.stored_name, f.file_path, f.mime_type
       FROM appointment_files f
       JOIN appointments a ON f.appointment_id = a.id
       WHERE f.id = ? AND a.id = ?`,
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = rows[0];
    const absolutePath = resolveFilePath(file.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    const mimeType = resolveMimeType(file);
    const safeName = String(file.original_name || file.stored_name || 'attachment').replace(/"/g, '');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.sendFile(absolutePath);
  } catch (err) { next(err); }
};

exports.removeFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;
    const [rows] = await pool.execute(
      'SELECT f.id FROM appointment_files f JOIN appointments a ON f.appointment_id = a.id WHERE f.id = ? AND a.id = ?',
      [fileId, id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    await pool.execute('DELETE FROM appointment_files WHERE id = ?', [fileId]);
    res.json({ success: true, message: 'File removed' });
  } catch (err) { next(err); }
};
