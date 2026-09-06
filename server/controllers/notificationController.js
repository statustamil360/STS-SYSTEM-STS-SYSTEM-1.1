const pool = require('../config/db');

const ownedIds = (ids, userId) => {
  const list = (Array.isArray(ids) ? ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return { list, userId };
};

exports.getAll = async (req, res, next) => {
  try {
    const { unread_only, is_read, search, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 15, 1);
    const offset = (pageNum - 1) * pageSize;

    let where = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true' || is_read === 'false') {
      where += ' AND is_read = FALSE';
    } else if (is_read === 'true') {
      where += ' AND is_read = TRUE';
    }

    if (search) {
      where += ' AND (title LIKE ? OR message LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications ${where}`,
      params
    );
    const [unread] = await pool.execute(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      unreadCount: unread[0].count,
      pagination: {
        total: countRows[0].total,
        page: pageNum,
        limit: pageSize,
      },
    });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

exports.markSelectedRead = async (req, res, next) => {
  try {
    const { list } = ownedIds(req.body.ids, req.user.id);
    if (!list.length) {
      return res.status(400).json({ success: false, message: 'Select at least one notification' });
    }
    const placeholders = list.map(() => '?').join(', ');
    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND id IN (${placeholders})`,
      [req.user.id, ...list]
    );
    res.json({ success: true, message: 'Selected notifications marked as read' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};

exports.removeSelected = async (req, res, next) => {
  try {
    const { list } = ownedIds(req.body.ids, req.user.id);
    if (!list.length) {
      return res.status(400).json({ success: false, message: 'Select at least one notification' });
    }
    const placeholders = list.map(() => '?').join(', ');
    await pool.execute(
      `DELETE FROM notifications WHERE user_id = ? AND id IN (${placeholders})`,
      [req.user.id, ...list]
    );
    res.json({ success: true, message: 'Selected notifications deleted' });
  } catch (err) { next(err); }
};
