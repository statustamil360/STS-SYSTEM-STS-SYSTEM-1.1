const pool = require('../config/db');

const CACHE_TTL_MS = 15000;
const cache = new Map();

/**
 * Settings that hold a whole number. `fallback` applies when the row is missing
 * or unparseable; values outside the range are clamped rather than rejected.
 */
const NUMERIC_SETTINGS = {
  conference_open_lead_minutes: { fallback: 15, min: 0, max: 720 },
};

const truthy = (value) => ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());

const readSetting = async (settingKey) => {
  const cached = cache.get(settingKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const [rows] = await pool.execute(
    'SELECT setting_value FROM settings WHERE setting_key = ?',
    [settingKey]
  );

  const value = rows.length ? rows[0].setting_value : null;
  cache.set(settingKey, { value, at: Date.now() });
  return value;
};

const getBooleanSetting = async (settingKey, defaultWhenAbsent = true) => {
  const raw = await readSetting(settingKey);
  if (raw === null || raw === undefined || raw === '') return defaultWhenAbsent;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'boolean') return parsed;
    if (typeof parsed === 'number') return parsed !== 0;
  } catch {
    /* raw string */
  }
  return truthy(raw);
};

const coerceNumericSetting = (settingKey, raw) => {
  const { fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER } = NUMERIC_SETTINGS[settingKey] || {};
  const parsed = Number(String(raw ?? '').trim());
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
};

const getNumericSetting = async (settingKey) => coerceNumericSetting(settingKey, await readSetting(settingKey));

const getStringSetting = async (settingKey, fallback = '') => {
  const raw = await readSetting(settingKey);
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
  } catch {
    /* raw string */
  }
  return String(raw);
};

const getSettingObject = async (settingKey, fallback = {}) => {
  const raw = await readSetting(settingKey);
  if (!raw) return { ...fallback };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return { ...fallback, ...parsed };
  } catch {
    /* ignore */
  }
  return { ...fallback };
};

const clearSettingsCache = () => cache.clear();

module.exports = {
  NUMERIC_SETTINGS,
  getBooleanSetting,
  getNumericSetting,
  getStringSetting,
  getSettingObject,
  coerceNumericSetting,
  clearSettingsCache,
};
