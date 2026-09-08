const pool = require('../config/db');
const { emitUserNotification } = require('./socketService');

const createNotification = async ({ userId, title, message, type = 'system' }, executor = pool) => {
  if (!userId) return null;
  const [result] = await executor.execute(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [userId, title, message, type]
  );
  const payload = {
    id: result.insertId,
    user_id: Number(userId),
    title,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  emitUserNotification(userId, payload);
  return payload;
};

const createNotifications = async (userIds, { title, message, type = 'system' }, executor = pool) => {
  const ids = [...new Set((userIds || []).map((id) => Number(id)).filter((id) => id > 0))];
  const created = [];
  for (const userId of ids) {
    created.push(await createNotification({ userId, title, message, type }, executor));
  }
  return created;
};

const notifyConferenceParticipants = async (conferenceId, { title, message, type = 'conference' }, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT user_id FROM conference_participants WHERE conference_id = ?',
    [conferenceId]
  );
  return createNotifications(rows.map((row) => row.user_id), { title, message, type }, executor);
};

const notifyRoles = async (roles, { title, message, type = 'system' }, executor = pool) => {
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.length) return [];
  const placeholders = list.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `SELECT u.id FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.name IN (${placeholders}) AND u.status = 'active'`,
    list
  );
  return createNotifications(rows.map((row) => row.id), { title, message, type }, executor);
};

module.exports = {
  createNotification,
  createNotifications,
  notifyConferenceParticipants,
  notifyRoles,
};
