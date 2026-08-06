const pool = require('../config/db');

const usernameFromEmail = (email) => {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 50);
  return base || `user_${Date.now()}`;
};

const ensureUniqueUsername = async (conn, baseUsername) => {
  let username = baseUsername;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await conn.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (!rows.length) return username;
    username = `${baseUsername.slice(0, 45)}_${suffix}`;
    suffix += 1;
  }
};

const emailExists = async (conn, email, excludeUserId = null) => {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE email = ? AND id != ?'
    : 'SELECT id FROM users WHERE email = ?';
  const params = excludeUserId ? [email, excludeUserId] : [email];
  const [rows] = await conn.execute(query, params);
  return rows.length > 0;
};

module.exports = { usernameFromEmail, ensureUniqueUsername, emailExists };
