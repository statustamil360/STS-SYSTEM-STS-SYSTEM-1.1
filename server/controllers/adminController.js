const pool = require('../config/db');
const { hashPassword } = require('../utils/password');
const { generateSequentialCode } = require('../utils/generateCode');
const { usernameFromEmail, ensureUniqueUsername, emailExists } = require('../utils/userHelpers');

const getRoleId = async (roleName) => {
  const [rows] = await pool.execute('SELECT id FROM roles WHERE name = ?', [roleName]);
  return rows[0]?.id;
};

const isDateParam = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

exports.getAll = async (req, res, next) => {
  try {
    const { search, status, created_from, created_to, last_login, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT a.id, a.admin_code, u.email, u.username, u.status, u.last_login,
             p.first_name, p.last_name, p.phone, a.created_at
      FROM admins a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (search) {
      const term = `%${search}%`;
      query += ` AND (p.first_name LIKE ? OR p.last_name LIKE ? OR u.email LIKE ?
        OR u.username LIKE ? OR a.admin_code LIKE ? OR p.phone LIKE ?)`;
      params.push(term, term, term, term, term, term);
    }
    if (['active', 'inactive', 'disabled'].includes(status)) {
      query += ' AND u.status = ?';
      params.push(status);
    }
    if (isDateParam(created_from)) {
      query += ' AND DATE(a.created_at) >= ?';
      params.push(created_from);
    }
    if (isDateParam(created_to)) {
      query += ' AND DATE(a.created_at) <= ?';
      params.push(created_to);
    }
    if (last_login === 'never') {
      query += ' AND u.last_login IS NULL';
    } else if (last_login === 'logged_in') {
      query += ' AND u.last_login IS NOT NULL';
    }

    const [countResult] = await pool.execute(
      query.replace(/SELECT a\.id.*FROM admins a/s, 'SELECT COUNT(*) as total FROM admins a'),
      params
    );

    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [rows] = await pool.execute(query, params);
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id, a.admin_code, u.email, u.username, u.status,
              p.first_name, p.last_name, p.phone, p.address, a.created_at
       FROM admins a JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id WHERE a.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, username, password, phone, status = 'active' } = req.body;

    if (await emailExists(conn, email)) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const roleId = await getRoleId('admin');
    const passwordHash = await hashPassword(password);
    const adminCode = await generateSequentialCode(conn, 'ADM', 'admins', 'admin_code');
    const resolvedUsername = username || await ensureUniqueUsername(conn, usernameFromEmail(email));

    const [userResult] = await conn.execute(
      'INSERT INTO users (role_id, email, username, password_hash, status) VALUES (?, ?, ?, ?, ?)',
      [roleId, email, resolvedUsername, passwordHash, status]
    );
    const userId = userResult.insertId;

    const nameParts = name.split(' ');
    await conn.execute(
      'INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [userId, nameParts[0], nameParts.slice(1).join(' ') || '', phone]
    );

    await conn.execute(
      'INSERT INTO admins (user_id, admin_code, created_by) VALUES (?, ?, ?)',
      [userId, adminCode, req.user.id]
    );

    await conn.commit();
    res.status(201).json({ success: true, message: 'Admin created successfully', data: { admin_code: adminCode } });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, email, phone, status } = req.body;
    const [admins] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.params.id]);
    if (!admins.length) return res.status(404).json({ success: false, message: 'Admin not found' });

    const userId = admins[0].user_id;
    if (email) {
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);
    }
    if (status) await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    if (name || phone) {
      const nameParts = name ? name.split(' ') : [];
      await pool.execute(
        'UPDATE user_profiles SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE user_id = ?',
        [nameParts[0] || null, nameParts.slice(1).join(' ') || null, phone || null, userId]
      );
    }

    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const [admins] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.params.id]);
    if (!admins.length) return res.status(404).json({ success: false, message: 'Admin not found' });

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, admins[0].user_id]);
    res.json({ success: true, message: `Admin ${status === 'active' ? 'activated' : 'disabled'}` });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const [admins] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.params.id]);
    if (!admins.length) return res.status(404).json({ success: false, message: 'Admin not found' });

    const passwordHash = await hashPassword(password);
    await pool.execute('UPDATE users SET password_hash = ?, refresh_token = NULL WHERE id = ?', [passwordHash, admins[0].user_id]);

    res.json({ success: true, message: 'Admin password reset successfully' });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const [admins] = await pool.execute('SELECT user_id FROM admins WHERE id = ?', [req.params.id]);
    if (!admins.length) return res.status(404).json({ success: false, message: 'Admin not found' });
    await pool.execute('DELETE FROM users WHERE id = ?', [admins[0].user_id]);
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    next(err);
  }
};
