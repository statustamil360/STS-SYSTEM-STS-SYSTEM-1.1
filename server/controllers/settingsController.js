const pool = require('../config/db');
const { createAuditLog } = require('../middleware/auditLog');
const { clearPermissionCache } = require('../middleware/receptionistPermission');

const BOOLEAN_SETTING_KEYS = [
  'receptionist_can_edit',
  'receptionist_can_delete',
  'receptionist_calendar_widget',
  'gp_conference_popup',
  'ahp_conference_popup',
  'gp_can_edit',
  'gp_can_delete',
  'ahp_can_edit',
  'ahp_can_delete',
  'dark_mode_allowed',
  'receptionist_dark_mode_allowed',
  'gp_dark_mode_allowed',
  'ahp_dark_mode_allowed',
  'gp_can_download_documents',
  'ahp_can_download_documents',
];

const SUPER_ADMIN_ONLY_KEYS = ['email_settings', 'sms_settings', 'whatsapp_settings'];

const GATEWAY_DEFAULTS = {
  email_settings: {
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    use_tls: true,
  },
  sms_settings: {
    enabled: false,
    provider: '',
    api_key: '',
    sender_id: '',
    api_url: '',
  },
  whatsapp_settings: {
    enabled: false,
    provider: '',
    api_key: '',
    phone_number_id: '',
    business_account_id: '',
    api_url: '',
  },
};

const parseSettingValue = (key, raw, settings) => {
  let value;
  try { value = JSON.parse(raw); }
  catch { value = raw; }
  if (BOOLEAN_SETTING_KEYS.includes(key)) {
    return toBoolean(value, settings[key]);
  }
  if (GATEWAY_DEFAULTS[key] && typeof value === 'object' && value !== null) {
    return { ...GATEWAY_DEFAULTS[key], ...value };
  }
  return value;
};

const toBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

exports.getPublic = async (req, res, next) => {
  try {
    const keys = ['timezone', 'hospital_name', 'language', 'theme', ...BOOLEAN_SETTING_KEYS];
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
      receptionist_can_edit: true,
      receptionist_can_delete: true,
      receptionist_calendar_widget: true,
      gp_conference_popup: true,
      ahp_conference_popup: true,
      gp_can_edit: true,
      gp_can_delete: false,
      ahp_can_edit: true,
      ahp_can_delete: false,
      dark_mode_allowed: true,
      receptionist_dark_mode_allowed: true,
      gp_dark_mode_allowed: true,
      ahp_dark_mode_allowed: true,
      gp_can_download_documents: false,
      ahp_can_download_documents: false,
    };
    rows.forEach((r) => {
      let value;
      try { value = JSON.parse(r.setting_value); }
      catch { value = r.setting_value; }
      settings[r.setting_key] = BOOLEAN_SETTING_KEYS.includes(r.setting_key)
        ? toBoolean(value, settings[r.setting_key])
        : value;
    });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value, updated_at FROM settings');
    const settings = {
      receptionist_can_edit: true,
      receptionist_can_delete: true,
      receptionist_calendar_widget: true,
      gp_conference_popup: true,
      ahp_conference_popup: true,
      gp_can_edit: true,
      gp_can_delete: false,
      ahp_can_edit: true,
      ahp_can_delete: false,
      dark_mode_allowed: true,
      receptionist_dark_mode_allowed: true,
      gp_dark_mode_allowed: true,
      ahp_dark_mode_allowed: true,
      gp_can_download_documents: false,
      ahp_can_download_documents: false,
      ...GATEWAY_DEFAULTS,
    };
    rows.forEach((r) => {
      settings[r.setting_key] = parseSettingValue(r.setting_key, r.setting_value, settings);
    });

    if (req.user?.role !== 'super_admin') {
      SUPER_ADMIN_ONLY_KEYS.forEach((key) => {
        delete settings[key];
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      if (SUPER_ADMIN_ONLY_KEYS.includes(key) && req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only Super Admin can update messaging gateway settings',
        });
      }

      const val = typeof value === 'object' ? JSON.stringify(value) : value;
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
        [key, val, req.user.id]
      );
    }
    clearPermissionCache();
    await createAuditLog({ userId: req.user.id, action: 'settings_change', ipAddress: req.ip });
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { next(err); }
};
