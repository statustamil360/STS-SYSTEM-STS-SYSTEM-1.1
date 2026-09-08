const pool = require('../config/db');
const { hashPassword } = require('../utils/password');
const { generateCode, generateSequentialCode } = require('../utils/generateCode');
const { usernameFromEmail, ensureUniqueUsername, emailExists } = require('../utils/userHelpers');
const { setUserStatus } = require('../utils/sessionHelpers');
const { createAuditLog } = require('../middleware/auditLog');
const {
  normalizePermissions,
  serializePermissions,
  clearReceptionistPermissionCache,
} = require('../services/receptionistPermissionService');
const { createNotification } = require('../services/notificationService');

const getRoleId = async (roleName) => {
  const [rows] = await pool.execute('SELECT id FROM roles WHERE name = ?', [roleName]);
  return rows[0]?.id;
};

const createStaffUser = async (conn, { roleName, email, username, password, name, phone, status = 'active', code, codeField, table, createdBy, extra = {}, profile = {} }) => {
  const roleId = await getRoleId(roleName);
  const passwordHash = await hashPassword(password);
  const resolvedUsername = username || await ensureUniqueUsername(conn, usernameFromEmail(email));

  const [userResult] = await conn.execute(
    'INSERT INTO users (role_id, email, username, password_hash, status) VALUES (?, ?, ?, ?, ?)',
    [roleId, email, resolvedUsername, passwordHash, status]
  );
  const userId = userResult.insertId;
  const nameParts = name.split(' ');

  await conn.execute(
    `INSERT INTO user_profiles (
      user_id, first_name, last_name, phone, date_of_birth, gender, nic, address, emergency_contact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      nameParts[0],
      nameParts.slice(1).join(' ') || '',
      phone || null,
      profile.date_of_birth || null,
      profile.gender || null,
      profile.nic || null,
      profile.address || null,
      profile.emergency_contact || null,
    ]
  );

  const cols = ['user_id', codeField, 'created_by', ...Object.keys(extra)];
  const vals = [userId, code, createdBy, ...Object.values(extra)];
  await conn.execute(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    vals
  );

  return { userId, code };
};

exports.getAll = async (req, res, next) => {
  try {
    const { search, status, gender, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT r.id, r.receptionist_code, r.permissions, u.email, u.username, u.status,
             p.first_name, p.last_name, p.phone, p.date_of_birth, p.gender, p.nic,
             p.address, p.emergency_contact, r.created_at
      FROM receptionists r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles p ON p.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) {
      query += ' AND (p.first_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (['male', 'female', 'other'].includes(gender)) {
      query += ' AND p.gender = ?';
      params.push(gender);
    }

    const countQuery = query.replace(/SELECT r\.id.*FROM receptionists r/s, 'SELECT COUNT(*) as total FROM receptionists r');
    const [countResult] = await pool.execute(countQuery, params);
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    const data = rows.map((row) => ({ ...row, permissions: normalizePermissions(row.permissions) }));

    res.json({ success: true, data, pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, username, password, phone, status = 'active', date_of_birth, gender, nic, address, emergency_contact, permissions } = req.body;

    if (await emailExists(conn, email)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const recCode = await generateSequentialCode(conn, 'REC', 'receptionists', 'receptionist_code', 3);
    const result = await createStaffUser(conn, {
      roleName: 'receptionist', email, username, password, name, phone, status,
      code: recCode, codeField: 'receptionist_code', table: 'receptionists', createdBy: req.user.id,
      profile: { date_of_birth, gender, nic, address, emergency_contact },
      extra: { permissions: serializePermissions(permissions) },
    });

    const [created] = await conn.execute(
      `SELECT r.id AS receptionist_id, r.receptionist_code, r.permissions, r.created_at,
              u.id AS user_id, u.email, u.status, p.first_name, p.last_name, p.phone,
              p.date_of_birth, p.gender, p.nic, p.address, p.emergency_contact
       FROM receptionists r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE r.user_id = ?`,
      [result.userId]
    );

    await conn.commit();

    await createAuditLog({
      userId: req.user.id,
      action: 'receptionist_created',
      entityType: 'receptionist',
      entityId: created[0].receptionist_id,
      details: { email, receptionist_code: created[0].receptionist_code },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Receptionist created successfully',
      data: {
        ...created[0],
        permissions: normalizePermissions(created[0].permissions),
        name: `${created[0].first_name || ''} ${created[0].last_name || ''}`.trim(),
        role: 'receptionist',
      },
    });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, email, phone, status, date_of_birth, gender, nic, address, emergency_contact, permissions } = req.body;
    const [rows] = await pool.execute('SELECT user_id FROM receptionists WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const userId = rows[0].user_id;

    if (permissions !== undefined) {
      await pool.execute(
        'UPDATE receptionists SET permissions = ? WHERE id = ?',
        [serializePermissions(permissions), req.params.id]
      );
      clearReceptionistPermissionCache(userId);
    }

    const [currentUser] = await pool.execute('SELECT status FROM users WHERE id = ?', [userId]);
    const previousStatus = currentUser[0]?.status;

    if (email) {
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    }

    let sessionRevoked = false;
    if (status && status !== previousStatus) {
      await setUserStatus(pool, userId, status);
      if (status !== 'active') {
        sessionRevoked = true;
        await createNotification({
          userId,
          title: 'Account Deactivated',
          message: `Your account was set to ${status} by an administrator. You have been signed out.`,
          type: 'security',
        });
      }
    }

    const profileSets = [];
    const profileValues = [];
    if (name !== undefined) {
      const parts = name.split(' ');
      profileSets.push('first_name = ?', 'last_name = ?');
      profileValues.push(parts[0] || '', parts.slice(1).join(' ') || '');
    }
    if (phone !== undefined) {
      profileSets.push('phone = ?');
      profileValues.push(phone || null);
    }
    if (date_of_birth !== undefined) {
      profileSets.push('date_of_birth = ?');
      profileValues.push(date_of_birth || null);
    }
    if (gender !== undefined) {
      profileSets.push('gender = ?');
      profileValues.push(gender || null);
    }
    if (nic !== undefined) {
      profileSets.push('nic = ?');
      profileValues.push(nic || null);
    }
    if (address !== undefined) {
      profileSets.push('address = ?');
      profileValues.push(address || null);
    }
    if (emergency_contact !== undefined) {
      profileSets.push('emergency_contact = ?');
      profileValues.push(emergency_contact || null);
    }
    if (profileSets.length) {
      await pool.execute(
        `UPDATE user_profiles SET ${profileSets.join(', ')} WHERE user_id = ?`,
        [...profileValues, userId]
      );
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'receptionist_updated',
      entityType: 'receptionist',
      entityId: parseInt(req.params.id, 10),
      details: { email, status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: sessionRevoked
        ? 'Receptionist updated and signed out from all devices'
        : 'Receptionist updated successfully',
      sessionRevoked,
    });
  } catch (err) { next(err); }
};

const resetStaffUserPassword = async (req, res, next, { table, entityType, entityLabel, auditAction }) => {
  try {
    const { password } = req.body;
    const [rows] = await pool.execute(`SELECT user_id FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: `${entityLabel} not found` });
    }

    const passwordHash = await hashPassword(password);
    await pool.execute(
      'UPDATE users SET password_hash = ?, refresh_token = NULL WHERE id = ?',
      [passwordHash, rows[0].user_id]
    );

    await createAuditLog({
      userId: req.user.id,
      action: auditAction,
      entityType,
      entityId: parseInt(req.params.id, 10),
      ipAddress: req.ip,
    });

    res.json({ success: true, message: `${entityLabel} password updated successfully` });
  } catch (err) { next(err); }
};

exports.resetReceptionistPassword = (req, res, next) =>
  resetStaffUserPassword(req, res, next, {
    table: 'receptionists',
    entityType: 'receptionist',
    entityLabel: 'Receptionist',
    auditAction: 'receptionist_password_reset',
  });

exports.resetGPPassword = (req, res, next) =>
  resetStaffUserPassword(req, res, next, {
    table: 'gps',
    entityType: 'gp',
    entityLabel: 'GP',
    auditAction: 'gp_password_reset',
  });

exports.resetAHPPassword = (req, res, next) =>
  resetStaffUserPassword(req, res, next, {
    table: 'allied_health_professionals',
    entityType: 'ahp',
    entityLabel: 'AHP',
    auditAction: 'ahp_password_reset',
  });

exports.getAssignableUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, r.name AS role, p.first_name, p.last_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.status = 'active' AND r.name IN ('gp', 'ahp', 'receptionist', 'admin')
       ORDER BY r.name, p.first_name, p.last_name`
    );
    res.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
      })),
    });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.receptionist_code, u.id AS user_id, u.email, p.first_name, p.last_name
       FROM receptionists r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Receptionist not found' });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'receptionist_deleted',
      entityType: 'receptionist',
      entityId: parseInt(req.params.id, 10),
      details: {
        email: rows[0].email,
        receptionist_code: rows[0].receptionist_code,
      },
      ipAddress: req.ip,
    });

    await pool.execute('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
    res.json({ success: true, message: 'Receptionist deleted successfully' });
  } catch (err) { next(err); }
};

exports.createGP = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, username, password, phone, specialization, registration_number, hospital, availability, status = 'active' } = req.body;

    if (await emailExists(conn, email)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const gpCode = await generateSequentialCode(conn, 'GP', 'gps', 'gp_code');
    const result = await createStaffUser(conn, {
      roleName: 'gp', email, username, password, name, phone, status,
      code: gpCode, codeField: 'gp_code', table: 'gps', createdBy: req.user.id,
      extra: { specialization, registration_number, hospital, availability },
    });
    await conn.commit();
    res.status(201).json({ success: true, message: 'GP created successfully', data: result });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
};

exports.getAllGPs = async (req, res, next) => {
  try {
    const { search, status, specialization, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT g.id, g.gp_code, g.specialization, g.registration_number, g.hospital, g.availability,
             u.email, u.status, p.first_name, p.last_name, p.phone
      FROM gps g JOIN users u ON g.user_id = u.id
      LEFT JOIN user_profiles p ON p.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) {
      query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR g.gp_code LIKE ? OR u.email LIKE ? OR g.specialization LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (specialization) { query += ' AND g.specialization = ?'; params.push(specialization); }
    const [countResult] = await pool.execute(query.replace(/SELECT g\.id.*FROM gps g/s, 'SELECT COUNT(*) as total FROM gps g'), params);
    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    const [specRows] = await pool.execute(
      `SELECT DISTINCT specialization FROM gps
       WHERE specialization IS NOT NULL AND TRIM(specialization) <> ''
       ORDER BY specialization`
    );
    res.json({
      success: true,
      data: rows,
      specializations: specRows.map((row) => row.specialization),
      pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

exports.updateGP = async (req, res, next) => {
  try {
    const { name, email, phone, status, specialization, registration_number, hospital, availability } = req.body;
    const [rows] = await pool.execute('SELECT user_id FROM gps WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const userId = rows[0].user_id;
    if (email) await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    if (status) await setUserStatus(pool, userId, status);
    if (name || phone) {
      const parts = name ? name.split(' ') : [];
      await pool.execute(
        'UPDATE user_profiles SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE user_id = ?',
        [parts[0] || null, parts.slice(1).join(' ') || null, phone || null, userId]
      );
    }
    await pool.execute(
      'UPDATE gps SET specialization = COALESCE(?, specialization), registration_number = COALESCE(?, registration_number), hospital = COALESCE(?, hospital), availability = COALESCE(?, availability) WHERE id = ?',
      [specialization, registration_number, hospital, availability, req.params.id]
    );
    res.json({ success: true, message: 'GP updated' });
  } catch (err) { next(err); }
};

exports.removeGP = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM gps WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    await pool.execute('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
    res.json({ success: true, message: 'GP deleted' });
  } catch (err) { next(err); }
};

exports.createAHP = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, username, password, phone, profession, registration_number, availability, status = 'active' } = req.body;

    if (await emailExists(conn, email)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const ahpCode = await generateSequentialCode(conn, 'AHP', 'allied_health_professionals', 'ahp_code');
    const result = await createStaffUser(conn, {
      roleName: 'ahp', email, username, password, name, phone, status,
      code: ahpCode, codeField: 'ahp_code', table: 'allied_health_professionals', createdBy: req.user.id,
      extra: { profession, registration_number, availability },
    });
    await conn.commit();
    res.status(201).json({ success: true, message: 'AHP created successfully', data: result });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
};

exports.getAllAHPs = async (req, res, next) => {
  try {
    const { search, status, profession, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT a.id, a.ahp_code, a.profession, a.registration_number, a.availability,
             u.email, u.status, p.first_name, p.last_name, p.phone
      FROM allied_health_professionals a JOIN users u ON a.user_id = u.id
      LEFT JOIN user_profiles p ON p.user_id = u.id WHERE 1=1`;
    const params = [];
    if (search) {
      query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR a.ahp_code LIKE ? OR u.email LIKE ? OR a.profession LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (profession) { query += ' AND a.profession = ?'; params.push(profession); }
    const [countResult] = await pool.execute(query.replace(/SELECT a\.id.*FROM allied_health_professionals a/s, 'SELECT COUNT(*) as total FROM allied_health_professionals a'), params);
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    const [professionRows] = await pool.execute(
      `SELECT DISTINCT profession FROM allied_health_professionals
       WHERE profession IS NOT NULL AND TRIM(profession) <> ''
       ORDER BY profession`
    );
    res.json({
      success: true,
      data: rows,
      professions: professionRows.map((row) => row.profession),
      pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) { next(err); }
};

exports.updateAHP = async (req, res, next) => {
  try {
    const { name, email, phone, status, profession, registration_number, availability } = req.body;
    const [rows] = await pool.execute('SELECT user_id FROM allied_health_professionals WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const userId = rows[0].user_id;
    if (email) await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    if (status) await setUserStatus(pool, userId, status);
    if (name || phone) {
      const parts = name ? name.split(' ') : [];
      await pool.execute(
        'UPDATE user_profiles SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE user_id = ?',
        [parts[0] || null, parts.slice(1).join(' ') || null, phone || null, userId]
      );
    }
    await pool.execute(
      'UPDATE allied_health_professionals SET profession = COALESCE(?, profession), registration_number = COALESCE(?, registration_number), availability = COALESCE(?, availability) WHERE id = ?',
      [profession, registration_number, availability, req.params.id]
    );
    res.json({ success: true, message: 'AHP updated' });
  } catch (err) { next(err); }
};

exports.removeAHP = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT user_id FROM allied_health_professionals WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    await pool.execute('DELETE FROM users WHERE id = ?', [rows[0].user_id]);
    res.json({ success: true, message: 'AHP deleted' });
  } catch (err) { next(err); }
};

module.exports.createStaffUser = createStaffUser;
module.exports.getRoleId = getRoleId;
