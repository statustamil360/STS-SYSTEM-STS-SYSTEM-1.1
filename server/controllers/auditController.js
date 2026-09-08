const pool = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');
const { createNotification } = require('../services/notificationService');

exports.getAll = async (req, res, next) => {
  try {
    const { action, entity_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT al.*, u.email, CONCAT(p.first_name, ' ', p.last_name) AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id WHERE 1=1`;
    const params = [];
    if (action) { query += ' AND al.action = ?'; params.push(action); }
    if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }

    const [countResult] = await pool.execute(
      query.replace(/SELECT al\.\*.*FROM audit_logs al/s, 'SELECT COUNT(*) as total FROM audit_logs al'),
      params
    );
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page, 10), limit: parseInt(limit, 10) } });
  } catch (err) { next(err); }
};

exports.getLoginHistory = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT lh.*, u.email, CONCAT(p.first_name, ' ', p.last_name) AS user_name
       FROM login_history lh JOIN users u ON lh.user_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ORDER BY lh.login_at DESC LIMIT 100`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.exportLogs = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000');
    await createAuditLog({ userId: req.user.id, action: 'export', entityType: 'audit_logs', ipAddress: req.ip });

    if (req.query.format === 'csv') {
      await createNotification({
        userId: req.user.id,
        title: 'Audit Log Export',
        message: `Audit log CSV export completed (${rows.length} record${rows.length === 1 ? '' : 's'}).`,
        type: 'export',
      });

      const header = 'id,user_id,action,entity_type,entity_id,created_at\n';
      const csv = rows.map((r) => `${r.id},${r.user_id},${r.action},${r.entity_type},${r.entity_id},${r.created_at}`).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      return res.send(header + csv);
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
