const STORAGE_TIMEZONE = 'Asia/Colombo';

const DATETIME_PARTS_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/;

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

const zonedWallClockToDate = (parts, timeZone) => {
  const asUtc = Date.UTC(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second);
  let instant = asUtc;
  for (let i = 0; i < 2; i += 1) {
    instant = asUtc - getOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
};

const toStoredInstant = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return zonedWallClockToDate({
      year: value.getUTCFullYear(),
      month: value.getUTCMonth(),
      day: value.getUTCDate(),
      hour: value.getUTCHours(),
      minute: value.getUTCMinutes(),
      second: value.getUTCSeconds(),
    }, STORAGE_TIMEZONE);
  }
  const match = String(value).trim().match(DATETIME_PARTS_RE);
  if (!match) return null;
  return zonedWallClockToDate({
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] || 0),
  }, STORAGE_TIMEZONE);
};

const formatStoredTime = (value, timeZone = STORAGE_TIMEZONE) => {
  const instant = toStoredInstant(value);
  if (!instant) {
    const clock = String(value || '').trim().match(TIME_ONLY_RE);
    if (!clock) return value ? String(value) : '—';
    const hours = Number(clock[1]);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(hour12).padStart(2, '0')}:${clock[2]} ${suffix}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || STORAGE_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(instant);
};

module.exports = {
  STORAGE_TIMEZONE,
  formatStoredTime,
};
