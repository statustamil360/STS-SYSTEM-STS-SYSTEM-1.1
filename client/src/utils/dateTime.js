import { DEFAULT_TIMEZONE } from './timezones';

const parseDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (value, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const d = parseDate(value);
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
  const d = parseDate(value);
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

export const formatTime = (value, timezone = DEFAULT_TIMEZONE, options = {}) => {
  const d = parseDate(value);
  if (!d) {
    if (value) return String(value).slice(0, 5);
    return '—';
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: options.withSeconds ? '2-digit' : undefined,
      hour12: true,
      ...options,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
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
