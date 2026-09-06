import { ROLES } from './constants';

// Sub-sections of the Conferences page, selected through the ?tab= query param.
const CONFERENCE_SUBMENU = [
  { title: 'Upcomings', path: '/conferences?tab=upcoming', icon: 'Event' },
  { title: 'Historys', path: '/conferences?tab=history', icon: 'History' },
  { title: 'Documents', path: '/conferences?tab=documents', icon: 'Description' },
  { title: 'Reports', path: '/conferences?tab=reports', icon: 'Assessment' },
];

const SETTINGS_SUBMENU = [
  { title: 'Preferences', path: '/preferences', icon: 'Tune' },
  { title: 'Profile', path: '/profile', icon: 'Person' },
];

const ADMIN_SETTINGS_SUBMENU = [
  { title: 'Preferences', path: '/preferences', icon: 'Tune' },
  { title: 'System Settings', path: '/settings', icon: 'Settings' },
  { title: 'Profile', path: '/profile', icon: 'Person' },
];

const SUPER_ADMIN_SETTINGS_SUBMENU = [
  { title: 'System Settings', path: '/settings', icon: 'Settings' },
  { title: 'Profile', path: '/profile', icon: 'Person' },
];

export const MENU_CONFIG = {
  [ROLES.SUPER_ADMIN]: [
    { section: 'Overview' },
    { title: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { section: 'Administration' },
    { title: 'Admin Management', path: '/admins', icon: 'AdminPanelSettings' },
    { section: 'Monitoring' },
    { title: 'Performance', path: '/performance', icon: 'Speed' },
    { title: 'Audit Logs', path: '/audit-logs', icon: 'Security' },
    { section: 'Analytics' },
    { title: 'Reports', path: '/reports', icon: 'Assessment' },
    { section: 'System' },
    { title: 'Settings', icon: 'Settings', children: SUPER_ADMIN_SETTINGS_SUBMENU },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
  ],
  [ROLES.ADMIN]: [
    { section: 'Overview' },
    { title: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { section: 'User Management' },
    { title: 'Receptionists', path: '/receptionists', icon: 'SupportAgent' },
    { title: 'General Practitioners', path: '/gps', icon: 'MedicalServices' },
    { title: 'Allied Health Professionals', path: '/ahps', icon: 'HealthAndSafety' },
    { section: 'Patient Management' },
    { title: 'Patients', path: '/patients', icon: 'LocalHospital' },
    { title: 'Tasks', path: '/tasks', icon: 'TaskAlt' },
    { section: 'Analytics' },
    { title: 'Reports', path: '/reports', icon: 'Assessment' },
    { title: 'Audit Logs', path: '/audit-logs', icon: 'History' },
    { title: 'Join Time Report', path: '/join-time-report', icon: 'AccessTime' },
    { section: 'System' },
    { title: 'Settings', icon: 'Settings', children: ADMIN_SETTINGS_SUBMENU },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
  ],
  [ROLES.RECEPTIONIST]: [
    { section: 'Overview' },
    { title: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { section: 'Patient Workflow' },
    { title: 'Patients', path: '/patients', icon: 'LocalHospital' },
    { title: 'Conferences', icon: 'VideoCall', children: CONFERENCE_SUBMENU },
    { title: 'Appointments', path: '/appointments', icon: 'Event' },
    { title: 'Join Time Report', path: '/join-time-report', icon: 'AccessTime' },
    { title: 'Tasks', path: '/tasks', icon: 'TaskAlt' },
    { section: 'Staff / Clinical' },
    { title: 'General Practitioners', path: '/gps', icon: 'MedicalServices' },
    { title: 'Allied Health Professionals', path: '/ahps', icon: 'HealthAndSafety' },
    { section: 'System' },
    { title: 'Settings', icon: 'Settings', children: SETTINGS_SUBMENU },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
  ],
  [ROLES.GP]: [
    { section: 'Overview' },
    { title: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { section: 'Clinical' },
    { title: 'Conferences', icon: 'VideoCall', children: CONFERENCE_SUBMENU },
    { title: 'Assigned Patients', path: '/patients', icon: 'LocalHospital' },
    { title: 'Medical Notes', path: '/medical-notes', icon: 'NoteAlt' },
    { title: 'Tasks', path: '/tasks', icon: 'TaskAlt' },
    { section: 'System' },
    { title: 'Settings', icon: 'Settings', children: SETTINGS_SUBMENU },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
  ],
  [ROLES.AHP]: [
    { section: 'Overview' },
    { title: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { section: 'Clinical' },
    { title: 'Conferences', icon: 'VideoCall', children: CONFERENCE_SUBMENU },
    { title: 'Assigned Patients', path: '/patients', icon: 'LocalHospital' },
    { title: 'Patient Reports', path: '/patient-reports', icon: 'Description' },
    { title: 'Tasks', path: '/tasks', icon: 'TaskAlt' },
    { section: 'System' },
    { title: 'Settings', icon: 'Settings', children: SETTINGS_SUBMENU },
    { title: 'Notifications', path: '/notifications', icon: 'Notifications' },
  ],
};
