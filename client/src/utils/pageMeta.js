import { ROLES } from './constants';

const CLINICAL_ROLES = [ROLES.GP, ROLES.AHP];

const PAGE_META = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of your workspace activity and key metrics',
  },
  '/patients': {
    title: (role) => (CLINICAL_ROLES.includes(role) ? 'Assigned Patients' : 'Patients'),
    subtitle: (role) => (CLINICAL_ROLES.includes(role)
      ? 'View patients assigned to you for clinical care and documentation'
      : 'Manage patient records for registration, scheduling, and care coordination'),
  },
  '/conferences': {
    title: 'Conferences',
    subtitle: (role) => (CLINICAL_ROLES.includes(role)
      ? 'View teleconference sessions assigned to you and access meeting links'
      : 'Schedule, join, and manage teleconference sessions with clinical staff'),
  },
  '/appointments': {
    title: 'Appointments',
    subtitle: 'Book conference appointments with patients, GPs, and multiple AHP professions',
  },
  '/join-time-report': {
    title: 'Time Calculator',
    subtitle: 'Calculate participant meeting join times by date, patient, and role for salary records',
  },
  '/tasks': {
    title: 'Tasks',
    subtitle: (role) => (CLINICAL_ROLES.includes(role)
      ? 'View and update tasks assigned to you'
      : 'Create, assign, and track operational and clinical tasks across staff'),
  },
  '/tasks?tab=inbox': {
    title: 'Assigned to Me',
    subtitle: 'Tasks other staff assigned to you — update progress, attach files, or manage your own items',
  },
  '/tasks?tab=assigned': {
    title: 'Assigned by Me',
    subtitle: 'Tasks you assigned to other staff — add, edit, or remove assignments',
  },
  '/notifications': {
    title: 'Notifications',
    subtitle: 'Stay updated on system alerts and activity',
  },
  '/profile': {
    title: 'Profile',
    subtitle: 'Manage your account settings and personal information',
  },
  '/preferences': {
    title: (role) => (CLINICAL_ROLES.includes(role) ? 'Audio & Video' : 'Preferences'),
    subtitle: (role) => (CLINICAL_ROLES.includes(role)
      ? 'Configure devices for conferences and meeting audio'
      : [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role)
        ? 'Control dark mode and document download access for staff roles'
        : 'Manage AHP profession options for allied health staff registration'),
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Configure system preferences and platform options',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'View analytics and generate operational reports',
  },
  '/audit-logs': {
    title: 'Audit Logs',
    subtitle: 'Review system activity and security events',
  },
  '/performance': {
    title: 'Performance',
    subtitle: 'Monitor platform performance and usage metrics',
  },
  '/admins': {
    title: 'Admin Management',
    subtitle: 'Manage administrator accounts and access',
  },
  '/receptionists': {
    title: 'Receptionists',
    subtitle: 'Manage receptionist accounts and credentials',
  },
  '/gps': {
    title: 'General Practitioners',
    subtitle: 'Manage GP profiles and clinical assignments',
  },
  '/ahps': {
    title: 'Allied Health Professionals',
    subtitle: 'Manage AHP profiles and care team assignments',
  },
  '/medical-notes': {
    title: 'Medical Notes',
    subtitle: 'Document and review patient clinical notes',
  },
  '/patient-reports': {
    title: 'Patient Reports',
    subtitle: 'Create and review allied health patient reports',
  },
};

const formatPathTitle = (pathname) => {
  const segment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getPageMeta = (pathname, role, search = '') => {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/dashboard';
  const query = search.startsWith('?') ? search : search ? `?${search}` : '';
  const keyed = query ? PAGE_META[`${path}${query}`] : null;
  const entry = keyed || PAGE_META[path];

  if (!entry) {
    return { title: formatPathTitle(path), subtitle: null };
  }

  return {
    title: typeof entry.title === 'function' ? entry.title(role) : entry.title,
    subtitle: typeof entry.subtitle === 'function' ? entry.subtitle(role) : entry.subtitle,
  };
};
