const pool = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');

exports.getPublic = async (req, res, next) => {
  try {
    const keys = ['timezone', 'hospital_name', 'language', 'theme'];
    const placeholders = keys.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`,
      keys,
    );
    const settings = {
      timezone: 'Asia/Colombo',
      hospital_name: '',
      language: 'en',
      theme: 'light',
    };
    rows.forEach((r) => {
      try { settings[r.setting_key] = JSON.parse(r.setting_value); }
      catch { settings[r.setting_key] = r.setting_value; }
    });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value, updated_at FROM settings');
    const settings = {};
    rows.forEach((r) => {
      try { settings[r.setting_key] = JSON.parse(r.setting_value); }
      catch { settings[r.setting_key] = r.setting_value; }
    });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      const val = typeof value === 'object' ? JSON.stringify(value) : value;
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [key, val, req.user.id]
      );
    }
    await createAuditLog({ userId: req.user.id, action: 'settings_change', ipAddress: req.ip });
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { next(err); }
};
