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
