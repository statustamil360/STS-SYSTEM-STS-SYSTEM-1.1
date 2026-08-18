const pool = require('../config/db');

const CACHE_TTL_MS = 15000;
const cache = new Map();

const truthy = (value) => ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());

const isPermissionGranted = async (settingKey, defaultWhenAbsent = true) => {
  const cacheKey = `${settingKey}:${defaultWhenAbsent}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const [rows] = await pool.execute(
    'SELECT setting_value FROM settings WHERE setting_key = ?',
    [settingKey]
  );

  const value = rows.length ? truthy(rows[0].setting_value) : defaultWhenAbsent;
  cache.set(cacheKey, { value, at: Date.now() });
  return value;
};

const DOCUMENT_DOWNLOAD_KEYS = {
  gp: 'gp_can_download_documents',
  ahp: 'ahp_can_download_documents',
};

const assertClinicalDocumentDownload = async (req, res) => {
  if (req.query.download !== '1') return true;

  const settingKey = DOCUMENT_DOWNLOAD_KEYS[req.user?.role];
  if (!settingKey) return true;

  if (await isPermissionGranted(settingKey, false)) return true;

  res.status(403).json({
    success: false,
    message: 'Document download has been disabled for your role by the administrator',
  });
  return false;
};

const clearPermissionCache = () => cache.clear();

const requireReceptionistPermission = (settingKey, deniedMessage) => async (req, res, next) => {
  try {
    if (req.user?.role !== 'receptionist') return next();

    if (await isPermissionGranted(settingKey)) return next();

    return res.status(403).json({ success: false, message: deniedMessage });
  } catch (err) {
    return next(err);
  }
};

const canReceptionistEdit = requireReceptionistPermission(
  'receptionist_can_edit',
  'Editing has been disabled for receptionists by the administrator'
);

const canReceptionistDelete = requireReceptionistPermission(
  'receptionist_can_delete',
  'Deleting has been disabled for receptionists by the administrator'
);

module.exports = {
  canReceptionistEdit,
  canReceptionistDelete,
  assertClinicalDocumentDownload,
  clearPermissionCache,
};
