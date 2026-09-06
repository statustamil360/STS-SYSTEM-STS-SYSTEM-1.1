const pool = require('../config/db');

/**
 * Per-receptionist permission flags stored as JSON on `receptionists.permissions`.
 * A key that is absent counts as granted, so accounts created before this feature
 * (and any key added later) keep the access they already had.
 */
const RECEPTIONIST_PERMISSION_KEYS = [
  'patients_page',
  'conferences_page',
  'appointments_page',
  'tasks_page',
  'gps_page',
  'ahps_page',
  'patients_create',
  'patients_edit',
  'patients_delete',
  'appointments_create',
  'appointments_edit',
  'appointments_delete',
  'tasks_create',
  'tasks_edit',
  'tasks_delete',
  'gps_create',
  'gps_edit',
  'gps_delete',
  'ahps_create',
  'ahps_edit',
  'ahps_delete',
  'conference_open',
  'conference_end',
  'documents_view',
  'documents_download',
  'reports_export',
];

const CACHE_TTL_MS = 15000;
const cache = new Map();

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const normalizePermissions = (raw) => {
  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
  }
  const source = parsed && typeof parsed === 'object' ? parsed : {};

  return RECEPTIONIST_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = key in source ? toBoolean(source[key]) : true;
    return acc;
  }, {});
};

const serializePermissions = (raw) => JSON.stringify(normalizePermissions(raw));

const getPermissionsByUserId = async (userId) => {
  const cacheKey = Number(userId);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const [rows] = await pool.execute(
    'SELECT permissions FROM receptionists WHERE user_id = ?',
    [userId]
  );

  const value = normalizePermissions(rows[0]?.permissions);
  cache.set(cacheKey, { value, at: Date.now() });
  return value;
};

const hasPermission = async (userId, permissionKey) => {
  const permissions = await getPermissionsByUserId(userId);
  return permissions[permissionKey] !== false;
};

const clearReceptionistPermissionCache = (userId) => {
  if (userId === undefined || userId === null) cache.clear();
  else cache.delete(Number(userId));
};

module.exports = {
  RECEPTIONIST_PERMISSION_KEYS,
  normalizePermissions,
  serializePermissions,
  getPermissionsByUserId,
  hasPermission,
  clearReceptionistPermissionCache,
};
