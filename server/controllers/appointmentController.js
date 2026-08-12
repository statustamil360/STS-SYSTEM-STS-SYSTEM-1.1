const fs = require('fs');
const pool = require('../config/db');
const { ensureAppointmentSequence, allocateAppointmentCode } = require('../utils/appointmentId');
const path = require('path');
const { uploadDir } = require('../config/jwt');
const { syncConferenceFromAppointment, cancelConferenceForAppointment, deleteConferenceForAppointment } = require('../services/conferenceSync');
const { processTimedOutConferences } = require('../services/conferenceTimeoutService');

const parseAhpAssignments = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const validateAhpAssignments = (assignments) => {
  const seen = new Set();
  for (const item of assignments) {
    if (!item.profession || !item.ahp_id) {
      return 'Each AHP row must have both profession and AHP selected';
    }
    const key = `${String(item.profession).trim().toLowerCase()}::${item.ahp_id}`;
    if (seen.has(key)) {
      return 'The same profession and AHP cannot be added twice in one appointment';
    }
    seen.add(key);
  }
  return null;
};

const appointmentSelectBase = `
  SELECT a.*,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.patient_code,
    CONCAT(gp_p.first_name, ' ', gp_p.last_name) AS gp_name,
    g.gp_code,
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
    ) AS ahp_summary
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  LEFT JOIN gps g ON a.gp_id = g.id
  LEFT JOIN users gp_u ON g.user_id = gp_u.id
  LEFT JOIN user_profiles gp_p ON gp_p.user_id = gp_u.id
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
     WHERE c.appointment_id = ?
     ORDER BY c.id DESC LIMIT 1`,
    [appointmentId]
  );
  return rows[0] || null;
};

const fetchAppointmentDetails = async (id) => {
  const [rows] = await pool.execute(`${appointmentSelectBase} WHERE a.id = ?`, [id]);
  if (!rows.length) return null;

  const [ahpRows] = await pool.execute(
    'SELECT id, profession, ahp_id FROM appointment_ahps WHERE appointment_id = ? ORDER BY id',
    [id]
  );
  const [fileRows] = await pool.execute(
    'SELECT id, original_name, stored_name, file_path, file_size, mime_type, created_at FROM appointment_files WHERE appointment_id = ? ORDER BY id',
    [id]
  );

  return {
    ...rows[0],
    ahp_assignments: ahpRows,
    files: fileRows.map((f) => ({
      ...f,
      url: `/uploads/${path.basename(f.file_path)}`,
    })),
    conference: await fetchLinkedConference(id),
  };
};

exports.getAll = async (req, res, next) => {
  try {
    await processTimedOutConferences();
    const { search, date, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `${appointmentSelectBase} WHERE 1=1`;
    const params = [];
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
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
        OR a.comments LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    const [countResult] = await pool.execute(
      query.replace(/SELECT a\.\*.*FROM appointments a/s, 'SELECT COUNT(*) as total FROM appointments a'),
      params
    );
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows,
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
      gp_id,
      appointment_date,
      appointment_time,
      title,
      important_note,
      comments,
      patient_previous_records,
      notes,
      status = 'scheduled',
    } = req.body;

    const ahpAssignments = parseAhpAssignments(req.body.ahp_assignments);
    const ahpError = validateAhpAssignments(ahpAssignments);
    if (ahpError) {
      return res.status(400).json({ success: false, message: ahpError });
    }

    if (!patient_id || !gp_id || !title?.trim()) {
      return res.status(400).json({ success: false, message: 'Patient, GP, and title are required' });
    }

    await ensureAppointmentSequence(conn);
    await conn.beginTransaction();
    const appointmentCode = await allocateAppointmentCode(conn);
    const firstAhpId = ahpAssignments.length ? ahpAssignments[0].ahp_id : null;

    const [result] = await conn.execute(
      `INSERT INTO appointments (
        appointment_code, patient_id, gp_id, ahp_id, title, important_note, comments,
        patient_previous_records, appointment_date, appointment_time, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentCode,
        Number(patient_id),
        Number(gp_id),
        firstAhpId,
        title.trim(),
        important_note || null,
        comments || null,
        patient_previous_records || null,
        appointment_date,
        appointment_time,
        status,
        notes || null,
        req.user.id,
      ]
    );

    const appointmentId = result.insertId;

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

    await conn.beginTransaction();

    const fields = [
      'patient_id', 'gp_id', 'appointment_date', 'appointment_time', 'status',
      'title', 'important_note', 'comments', 'patient_previous_records', 'notes',
    ];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f] === '' ? null : req.body[f]);
      }
    });

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
      await cancelConferenceForAppointment(conn, id);
    }

    await conn.commit();
    const updated = await fetchAppointmentDetails(id);
    res.json({ success: true, message: 'Appointment updated', data: updated });
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
