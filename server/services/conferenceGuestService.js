const crypto = require('crypto');
const pool = require('../config/db');
const { hashPassword } = require('../utils/password');
const { clientUrl } = require('../config/jwt');

const generateAccessCode = async (conn) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const [existing] = await conn.execute(
      'SELECT id FROM conference_guest_access WHERE access_code = ?',
      [code]
    );
    if (!existing.length) return code;
  }
  throw new Error('Unable to generate unique guest access code');
};
const generateTempPassword = () => crypto.randomBytes(4).toString('hex');

const getGuestRoleId = async (conn) => {
  const [rows] = await conn.execute("SELECT id FROM roles WHERE name = 'conference_guest'");
  if (!rows.length) throw new Error('conference_guest role not found — run migrate-clinical-reports');
  return rows[0].id;
};

exports.createGuestAccess = async ({
  conferenceId,
  guestName,
  guestEmail,
  guestRole,
  createdBy,
  expiresInHours = 24,
}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const accessCode = await generateAccessCode(conn);
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const guestRoleId = await getGuestRoleId(conn);

    const normalizedEmail = guestEmail.trim().toLowerCase();
    const username = `guest_${accessCode.toLowerCase()}`;

    const [existingUser] = await conn.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    let userId;

    if (existingUser.length) {
      userId = existingUser[0].id;
      await conn.execute('UPDATE users SET password_hash = ?, status = ? WHERE id = ?', [
        passwordHash, 'active', userId,
      ]);
    } else {
      const [userResult] = await conn.execute(
        'INSERT INTO users (role_id, email, username, password_hash, status) VALUES (?, ?, ?, ?, ?)',
        [guestRoleId, normalizedEmail, username, passwordHash, 'active']
      );
      userId = userResult.insertId;
      const nameParts = guestName.trim().split(/\s+/);
      const firstName = nameParts[0] || guestName;
      const lastName = nameParts.slice(1).join(' ') || 'Guest';
      await conn.execute(
        'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)',
        [userId, firstName, lastName]
      );
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const joinUrl = `${clientUrl}/guest-conference?code=${accessCode}`;

    const [result] = await conn.execute(
      `INSERT INTO conference_guest_access
       (conference_id, guest_name, guest_email, guest_role, access_code, temp_password_hash, temp_password, user_id, join_url, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conferenceId, guestName.trim(), normalizedEmail, guestRole,
        accessCode, passwordHash, tempPassword, userId, joinUrl, createdBy, expiresAt,
      ]
    );

    await conn.execute(
      'INSERT INTO conference_participants (conference_id, user_id, role_in_conference) VALUES (?, ?, ?)',
      [conferenceId, userId, guestRole === 'guest_gp' ? 'gp' : 'ahp']
    );

    await conn.execute(
      `INSERT IGNORE INTO conference_clinical_reports
       (conference_id, user_id, participant_role, display_name)
       VALUES (?, ?, ?, ?)`,
      [conferenceId, userId, guestRole, guestName.trim()]
    );

    await conn.commit();

    return {
      id: result.insertId,
      accessCode,
      tempPassword,
      joinUrl,
      guestEmail: normalizedEmail,
      guestName: guestName.trim(),
      guestRole,
      expiresAt,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.listGuests = async (conferenceId) => {
  const [rows] = await pool.execute(
    `SELECT id, guest_name, guest_email, guest_role, access_code, join_url, expires_at, revoked_at, created_at
     FROM conference_guest_access
     WHERE conference_id = ? AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [conferenceId]
  );
  return rows;
};

exports.getGuestCredentials = async (guestId, conferenceId) => {
  const [rows] = await pool.execute(
    `SELECT id, guest_name, guest_email, guest_role, access_code, join_url, temp_password
     FROM conference_guest_access
     WHERE id = ? AND conference_id = ? AND revoked_at IS NULL`,
    [guestId, conferenceId]
  );
  if (!rows.length) return null;
  const g = rows[0];
  return {
    id: g.id,
    guestName: g.guest_name,
    guestEmail: g.guest_email,
    guestRole: g.guest_role,
    accessCode: g.access_code,
    joinUrl: g.join_url,
    tempPassword: g.temp_password || null,
  };
};

exports.resetGuestPassword = async (guestId, conferenceId) => {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const [result] = await pool.execute(
    `UPDATE conference_guest_access
     SET temp_password = ?, temp_password_hash = ?
     WHERE id = ? AND conference_id = ? AND revoked_at IS NULL`,
    [tempPassword, passwordHash, guestId, conferenceId]
  );
  if (!result.affectedRows) return null;

  const [userRows] = await pool.execute(
    'SELECT user_id FROM conference_guest_access WHERE id = ?',
    [guestId]
  );
  if (userRows[0]?.user_id) {
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash, userRows[0].user_id,
    ]);
  }

  return exports.getGuestCredentials(guestId, conferenceId);
};

exports.revokeGuest = async (guestId, conferenceId) => {
  const [rows] = await pool.execute(
    'SELECT user_id FROM conference_guest_access WHERE id = ? AND conference_id = ? AND revoked_at IS NULL',
    [guestId, conferenceId]
  );
  if (!rows.length) return false;

  await pool.execute(
    'UPDATE conference_guest_access SET revoked_at = NOW() WHERE id = ? AND conference_id = ?',
    [guestId, conferenceId]
  );

  if (rows[0].user_id) {
    await pool.execute(
      'DELETE FROM conference_participants WHERE conference_id = ? AND user_id = ?',
      [conferenceId, rows[0].user_id]
    );
  }
  return true;
};

exports.findGuestByCode = async (accessCode) => {
  const [rows] = await pool.execute(
    `SELECT g.*, c.conference_code, c.status AS conference_status
     FROM conference_guest_access g
     JOIN conferences c ON c.id = g.conference_id
     WHERE g.access_code = ? AND g.revoked_at IS NULL AND g.expires_at > NOW()`,
    [accessCode.toUpperCase()]
  );
  return rows[0] || null;
};
