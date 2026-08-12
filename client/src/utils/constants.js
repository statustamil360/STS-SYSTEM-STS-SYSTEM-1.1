export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  GP: 'gp',
  AHP: 'ahp',
  CONFERENCE_GUEST: 'conference_guest',
};

export const ROLE_HOME_PATHS = {
  super_admin: '/dashboard',
  admin: '/dashboard',
  receptionist: '/dashboard',
  gp: '/dashboard',
  ahp: '/dashboard',
  conference_guest: '/conferences',
};

export const getRoleHomePath = (role) => ROLE_HOME_PATHS[role] || '/dashboard';

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  receptionist: 'Receptionist',
  gp: 'General Practitioner',
  ahp: 'Allied Health Professional',
};

export const CONFERENCE_STATUS = ['scheduled', 'waiting', 'live', 'completed', 'cancelled'];
export const TASK_PRIORITY = ['low', 'medium', 'high', 'critical'];
export const TASK_STATUS = ['pending', 'in_progress', 'completed'];

export const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export const parseWeekdays = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(',').map((d) => d.trim()).filter(Boolean);
};

export const formatWeekdays = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
};

export const WEEKDAY_SELECT_PLACEHOLDER = 'select week days';

export const formatWeekdayShort = (day) => {
  if (!day) return '';
  const normalized = String(day).trim();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1, 2).toLowerCase();
};

export const formatWeekdayInitials = (value) => {
  const days = parseWeekdays(value);
  if (!days.length) return '—';
  return days.map(formatWeekdayShort).join(', ');
};

export const STATUS_COLORS = {
  active: 'success',
  inactive: 'default',
  disabled: 'error',
  scheduled: 'info',
  waiting: 'warning',
  live: 'success',
  completed: 'success',
  cancelled: 'error',
  confirmed: 'success',
  no_show: 'warning',
  pending: 'warning',
  in_progress: 'info',
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};
