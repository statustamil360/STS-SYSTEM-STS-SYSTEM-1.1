const pool = require('../config/db');
const { generateCode } = require('../utils/generateCode');
const videoService = require('../services/videoService');
const { processTimedOutConferences } = require('../services/conferenceTimeoutService');

const conferenceSelectBase = `
  SELECT c.id, c.conference_code, c.appointment_id, c.patient_id, c.gp_id, c.ahp_id,
         DATE_FORMAT(c.scheduled_date, '%Y-%m-%d') AS scheduled_date,
         TIME_FORMAT(c.scheduled_time, '%H:%i:%s') AS scheduled_time,
         c.status, c.cancelled_reason, c.cancelled_at, c.meeting_link, c.room_id, c.notes, c.accepted_at, c.accepted_by,
         c.created_by, c.created_at, c.updated_at,
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
           WHERE cp.conference_id = c.id AND cp.role_in_conference = 'ahp'
         ) AS ahp_participants
  FROM conferences c
  JOIN patients pat ON c.patient_id = pat.id
  LEFT JOIN gps gp ON c.gp_id = gp.id
  LEFT JOIN user_profiles gp_p ON gp.user_id = gp_p.user_id
  LEFT JOIN allied_health_professionals ahp ON c.ahp_id = ahp.id
  LEFT JOIN user_profiles ahp_p ON ahp.user_id = ahp_p.user_id
`;

const applyRoleFilter = async (req, query, params) => {
  if (req.user.role === 'gp') {
    const [gpRows] = await pool.execute('SELECT id FROM gps WHERE user_id = ?', [req.user.id]);
    if (gpRows.length) {
      query += ' AND c.gp_id = ?';
      params.push(gpRows[0].id);
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

const getConferenceById = async (id) => {
  const [rows] = await pool.execute(`${conferenceSelectBase} WHERE c.id = ?`, [id]);
  return rows[0] || null;
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
  if (user.role === 'gp' && conference.gp_id === gpId) return true;
  if (user.role === 'ahp') {
    if (conference.ahp_id === ahpId) return true;
    const [rows] = await pool.execute(
      'SELECT id FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conference.id, user.id]
    );
    return rows.length > 0;
  }
  return ['receptionist', 'admin', 'super_admin'].includes(user.role);
};

exports.getAll = async (req, res, next) => {
  try {
    await processTimedOutConferences();
    const { search, status, date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `${conferenceSelectBase} WHERE 1=1`;
    const params = [];

    query = await applyRoleFilter(req, query, params);

    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (date) { query += ' AND c.scheduled_date = ?'; params.push(date); }
    if (search) {
      query += ` AND (c.conference_code LIKE ? OR CONCAT(pat.first_name, ' ', pat.last_name) LIKE ?
        OR CONCAT(gp_p.first_name, ' ', gp_p.last_name) LIKE ? OR CONCAT(ahp_p.first_name, ' ', ahp_p.last_name) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.execute(
      query.replace(/SELECT c\.\*.*FROM conferences c/s, 'SELECT COUNT(*) as total FROM conferences c'),
      params
    );
    query += ' ORDER BY c.scheduled_date DESC, c.scheduled_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

exports.getToday = async (req, res, next) => {
  try {
    await processTimedOutConferences();
    let query = `${conferenceSelectBase} WHERE c.scheduled_date = CURDATE()
      AND c.status NOT IN ('cancelled')`;
    const params = [];
    query = await applyRoleFilter(req, query, params);
    query += ` ORDER BY
      CASE c.status WHEN 'live' THEN 0 WHEN 'waiting' THEN 1 WHEN 'scheduled' THEN 2 ELSE 3 END,
      c.scheduled_time ASC`;
    const [rows] = await pool.execute(query, params);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
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

exports.create = async (req, res, next) => {
  try {
    const { patient_id, gp_id, ahp_id, scheduled_date, scheduled_time, meeting_link, notes } = req.body;
    const conferenceCode = generateCode('CONF');
    const link = meeting_link || `https://meet.amc.com/${conferenceCode.toLowerCase()}`;

    const [result] = await pool.execute(
      `INSERT INTO conferences (conference_code, patient_id, gp_id, ahp_id, scheduled_date, scheduled_time, meeting_link, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [conferenceCode, patient_id, gp_id || null, ahp_id || null, scheduled_date, scheduled_time, link, notes, req.user.id]
    );

    const participantIds = [];
    if (gp_id) {
      const [gpUser] = await pool.execute('SELECT user_id FROM gps WHERE id = ?', [gp_id]);
      if (gpUser.length) participantIds.push({ userId: gpUser[0].user_id, role: 'gp' });
    }
    if (ahp_id) {
      const [ahpUser] = await pool.execute('SELECT user_id FROM allied_health_professionals WHERE id = ?', [ahp_id]);
      if (ahpUser.length) participantIds.push({ userId: ahpUser[0].user_id, role: 'ahp' });
    }

    for (const p of participantIds) {
      await pool.execute(
        'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
        [result.insertId, p.userId, p.role]
      );
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [p.userId, 'Conference Created', `You are invited to conference ${conferenceCode}`, 'conference']
      );
    }

    res.status(201).json({ success: true, message: 'Conference created', data: { id: result.insertId, conference_code: conferenceCode } });
  } catch (err) { next(err); }
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
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, type) SELECT user_id, ?, ?, ? FROM conference_participants WHERE conference_id = ?',
        ['Conference Started', 'A conference has started', 'conference', req.params.id]
      );
    }

    values.push(req.params.id);
    await pool.execute(`UPDATE conferences SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Conference updated' });
  } catch (err) { next(err); }
};

exports.accept = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (req.user.role !== 'gp') {
      return res.status(403).json({ success: false, message: 'Only the assigned GP can accept this meeting' });
    }

    const { gpId } = await getStaffContext(req.user);
    if (conference.gp_id !== gpId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this conference' });
    }
    if (['completed', 'cancelled'].includes(conference.status)) {
      return res.status(400).json({ success: false, message: 'This conference is no longer available' });
    }

    const room = await videoService.ensureRoom(conference.conference_code);
    const [profile] = await pool.execute(
      'SELECT first_name, last_name FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const userName = profile.length
      ? `${profile[0].first_name} ${profile[0].last_name}`.trim()
      : 'GP';

    const token = await videoService.createMeetingToken({
      roomName: room.roomId,
      userName,
      isOwner: true,
    });

    await pool.execute(
      `UPDATE conferences SET status = 'live', accepted_at = NOW(), accepted_by = ?, room_id = ? WHERE id = ?`,
      [req.user.id, room.roomId, conference.id]
    );

    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT user_id, ?, ?, ? FROM conference_participants
       WHERE conference_id = ? AND role_in_conference = 'ahp'`,
      ['Meeting Accepted', `GP has accepted conference ${conference.conference_code}. You can now join.`, 'conference', conference.id]
    );

    res.json({
      success: true,
      message: 'Meeting accepted',
      data: {
        provider: room.provider,
        roomUrl: room.roomUrl,
        roomId: room.roomId,
        token,
      },
    });
  } catch (err) { next(err); }
};

exports.join = async (req, res, next) => {
  try {
    const conference = await getConferenceById(req.params.id);
    if (!conference) {
      return res.status(404).json({ success: false, message: 'Conference not found' });
    }
    if (!['gp', 'ahp'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only clinical staff can join meetings' });
    }

    const assigned = await isAssignedParticipant(conference, req.user);
    if (!assigned) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this conference' });
    }

    if (req.user.role === 'ahp' && conference.status !== 'live') {
      return res.status(403).json({
        success: false,
        message: 'Meeting has not been accepted by the GP yet',
      });
    }

    if (conference.status === 'completed' || conference.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This conference has ended' });
    }

    const room = await videoService.ensureRoom(conference.conference_code);
    const [profile] = await pool.execute(
      'SELECT first_name, last_name FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );
    const userName = profile.length
      ? `${profile[0].first_name} ${profile[0].last_name}`.trim()
      : req.user.role.toUpperCase();

    const token = await videoService.createMeetingToken({
      roomName: room.roomId,
      userName,
      isOwner: req.user.role === 'gp',
    });

    if (conference.status !== 'live' && req.user.role === 'gp') {
      await pool.execute(
        `UPDATE conferences SET status = 'live', room_id = ? WHERE id = ?`,
        [room.roomId, conference.id]
      );
    }

    await pool.execute(
      'UPDATE conference_participants SET joined_at = COALESCE(joined_at, NOW()) WHERE conference_id = ? AND user_id = ?',
      [conference.id, req.user.id]
    );

    res.json({
      success: true,
      data: {
        provider: room.provider,
        roomUrl: room.roomUrl,
        roomId: room.roomId,
        token,
        conference: { id: conference.id, status: 'live', conference_code: conference.conference_code },
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
    if (req.user.role !== 'gp') {
      return res.status(403).json({ success: false, message: 'Only the GP can end this meeting' });
    }

    const { gpId } = await getStaffContext(req.user);
    if (conference.gp_id !== gpId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this conference' });
    }

    await pool.execute(`UPDATE conferences SET status = 'completed' WHERE id = ?`, [conference.id]);
    res.json({ success: true, message: 'Meeting ended' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM conferences WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Conference deleted' });
  } catch (err) { next(err); }
};
