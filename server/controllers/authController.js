const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/token');
const { createAuditLog } = require('../middleware/auditLog');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      `SELECT u.*, r.name AS role FROM users u
       JOIN roles r ON u.role_id = r.id WHERE u.email = ?`,
      [email]
    );

    if (!users.length) {
      await createAuditLog({
        userId: null,
        action: 'login',
        entityType: 'auth',
        details: { status: 'failed', reason: 'unknown_email', email },
        ipAddress: req.ip,
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      await pool.execute(
        'INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)',
        [user.id, req.ip, req.headers['user-agent'], 'failed']
      );
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await pool.execute(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    await pool.execute(
      'INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)',
      [user.id, req.ip, req.headers['user-agent'], 'success']
    );

    await createAuditLog({
      userId: user.id,
      action: 'login',
      ipAddress: req.ip,
    });

    const [profiles] = await pool.execute(
      'SELECT first_name, last_name, phone, profile_picture FROM user_profiles WHERE user_id = ?',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          profile: profiles[0] || null,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const [users] = await pool.execute(
      'SELECT id, email, refresh_token FROM users WHERE id = ? AND status = ?',
      [decoded.id, 'active']
    );

    if (!users.length || users[0].refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: users.length ? 'Invalid refresh token' : 'Invalid or inactive user',
        code: 'SESSION_INVALID',
      });
    }

    const [roleRows] = await pool.execute(
      'SELECT r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [decoded.id]
    );

    const payload = { id: decoded.id, email: decoded.email, role: roleRows[0].role };
    const accessToken = generateAccessToken(payload);

    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await pool.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    await pool.execute(
      'UPDATE login_history SET logout_at = NOW() WHERE user_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1',
      [req.user.id]
    );
    await createAuditLog({ userId: req.user.id, action: 'logout', ipAddress: req.ip });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await comparePassword(currentPassword, users[0].password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await hashPassword(newPassword);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Password Changed', 'Your password was changed successfully.', 'security']
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.username, u.status, r.name AS role,
              p.first_name, p.last_name, p.phone, p.profile_picture, p.address
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, address } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : undefined;

    const [existing] = await pool.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length) {
      const fields = [];
      const values = [];
      if (first_name !== undefined) { fields.push('first_name = ?'); values.push(first_name); }
      if (last_name !== undefined) { fields.push('last_name = ?'); values.push(last_name); }
      if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
      if (address !== undefined) { fields.push('address = ?'); values.push(address); }
      if (profilePicture) { fields.push('profile_picture = ?'); values.push(profilePicture); }
      if (fields.length) {
        values.push(req.user.id);
        await pool.execute(`UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = ?`, values);
      }
    } else {
      await pool.execute(
        'INSERT INTO user_profiles (user_id, first_name, last_name, phone, address, profile_picture) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, first_name, last_name, phone, address, profilePicture || null]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getMe = exports.getProfile;
