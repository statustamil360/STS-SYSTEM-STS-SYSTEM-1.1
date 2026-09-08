import { DEFAULT_TIMEZONE } from './timezones';

const DATETIME_PARTS_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;

/** MySQL NOW() wall-clock values are recorded in this zone, then shown in the admin timezone. */
export const STORAGE_TIMEZONE = DEFAULT_TIMEZONE;

const parseDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const parseWallClockParts = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(DATETIME_PARTS_RE);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  };
};

const getOffsetMs = (date, timeZone) => {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value || '';
  const match = String(name).replace(/^UTC/i, 'GMT').match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 3600000 + Number(match[3] || 0) * 60000);
};

/** Interpret Y-M-D h:m:s as a wall clock in `timeZone` and return the real instant. */
const zonedWallClockToDate = (parts, timeZone) => {
  const asUtc = Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second);
  let instant = asUtc;
  for (let i = 0; i < 2; i += 1) {
    instant = asUtc - getOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
};

/**
 * API datetimes are hospital wall-clock numbers (often tagged as UTC by mysql2).
 * Convert them to a real instant using STORAGE_TIMEZONE, then format in the
 * admin timezone so Settings → Timezone updates every timestamp.
 */
export const toStoredInstant = (value, storageTimezone = STORAGE_TIMEZONE) => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return zonedWallClockToDate({
      year: value.getUTCFullYear(),
      month: value.getUTCMonth(),
      day: value.getUTCDate(),
      hour: value.getUTCHours(),
      minute: value.getUTCMinutes(),
      second: value.getUTCSeconds(),
    }, storageTimezone);
  }
  const parts = parseWallClockParts(value);
  if (parts) return zonedWallClockToDate(parts, storageTimezone);
  return parseDate(value);
};

export const formatDateTime = (value, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const d = toStoredInstant(value);
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
};

export const formatDate = (value, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const formatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };
  if (typeof value === 'string') {
    const key = extractDateKey(value);
    if (key) {
      const [year, month, day] = key.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: 'UTC',
          ...formatOptions,
        }).format(utcDate);
      } catch {
        return key;
      }
    }
  }
  const d = parseDate(value);
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      ...formatOptions,
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

export const formatTime = (value, timezone = DEFAULT_TIMEZONE, options = {}) => {
  if (value == null || value === '') return '—';
  const { date, withSeconds, ...intlOptions } = options;
  const asString = String(value).trim();
  if (TIME_ONLY_RE.test(asString) && !DATETIME_PARTS_RE.test(asString)) {
    if (date) return formatStoredClock(asString, date, timezone, { withSeconds });
    return formatClockTime(asString);
  }
  const d = toStoredInstant(value);
  if (!d) return asString.slice(0, 5) || '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: withSeconds ? '2-digit' : undefined,
      hour12: true,
      ...intlOptions,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
};

/** Convert a TIME_FORMAT clock (hospital local) into the admin timezone. */
export const formatStoredClock = (timeValue, dateValue, timezone = DEFAULT_TIMEZONE, options = {}) => {
  if (!timeValue) return '—';
  const match = String(timeValue).trim().match(TIME_ONLY_RE);
  if (!match) return formatClockTime(timeValue);
  const key = extractDateKey(dateValue);
  if (!key) return formatClockTime(timeValue);
  const [year, month, day] = key.split('-').map(Number);
  const d = zonedWallClockToDate({
    year,
    month: month - 1,
    day,
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: Number(match[3] || 0),
  }, STORAGE_TIMEZONE);
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: options.withSeconds ? '2-digit' : undefined,
      hour12: true,
    }).format(d);
  } catch {
    return formatClockTime(timeValue);
  }
};

export const formatClock = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = date instanceof Date ? date : new Date();
  try {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(d);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value || '';

    const zone = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;

    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);

    return { time, zone, offset, dateLabel };
  } catch {
    return {
      time: d.toLocaleTimeString(),
      zone: timezone.split('/').pop()?.replace(/_/g, ' ') || timezone,
      offset: '',
      dateLabel: d.toLocaleDateString(),
    };
  }
};

const extractDateKey = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = parseDate(value);
  if (!d) return '';
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * Formats a date-only value with no time and no timezone shifting. Date columns
 * arrive as UTC midnight, so converting to a local zone can roll the day over.
 */
export const formatCalendarDate = (value, options = {}) => {
  const key = extractDateKey(value);
  if (!key) return '—';
  const [year, month, day] = key.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    }).format(utcDate);
  } catch {
    return key;
  }
};

/** Formats an 'HH:mm[:ss]' clock string as 12-hour with AM/PM. */
export const formatClockTime = (value) => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  const hours = Number(match[1]);
  if (!Number.isInteger(hours) || hours < 0 || hours > 23) return String(value);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${match[2]} ${suffix}`;
};

export const formatDateKey = (value, timezone = DEFAULT_TIMEZONE) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = parseDate(value);
  if (!d) return String(value || '').slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
};

/** Format seconds as human-readable duration (e.g. 1h 05m 30s). */
export const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (seconds === 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && h === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
};
