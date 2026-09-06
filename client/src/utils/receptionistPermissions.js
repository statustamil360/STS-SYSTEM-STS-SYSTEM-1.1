/**
 * Mirrors server/services/receptionistPermissionService.js.
 * An absent key counts as granted so existing accounts keep their access.
 */
export const RECEPTIONIST_PERMISSION_GROUPS = [
  {
    title: 'Patients',
    pageKey: 'patients_page',
    permissions: [
      { key: 'patients_create', label: 'Add' },
      { key: 'patients_edit', label: 'Edit' },
      { key: 'patients_delete', label: 'Delete' },
    ],
  },
  {
    title: 'Conferences',
    pageKey: 'conferences_page',
    permissions: [
      { key: 'conference_open', label: 'Open meeting' },
      { key: 'conference_end', label: 'End meeting' },
      { key: 'documents_view', label: 'View documents' },
      { key: 'documents_download', label: 'Download documents' },
      { key: 'reports_export', label: 'Export meeting reports' },
    ],
  },
  {
    title: 'Appointments',
    pageKey: 'appointments_page',
    permissions: [
      { key: 'appointments_create', label: 'Add' },
      { key: 'appointments_edit', label: 'Edit' },
      { key: 'appointments_delete', label: 'Delete' },
    ],
  },
  {
    title: 'Task List',
    pageKey: 'tasks_page',
    permissions: [
      { key: 'tasks_create', label: 'Add' },
      { key: 'tasks_edit', label: 'Edit' },
      { key: 'tasks_delete', label: 'Delete' },
    ],
  },
  {
    title: 'General Practitioners',
    pageKey: 'gps_page',
    permissions: [
      { key: 'gps_create', label: 'Add' },
      { key: 'gps_edit', label: 'Edit' },
      { key: 'gps_delete', label: 'Delete' },
    ],
  },
  {
    title: 'Allied Health Professionals',
    pageKey: 'ahps_page',
    permissions: [
      { key: 'ahps_create', label: 'Add' },
      { key: 'ahps_edit', label: 'Edit' },
      { key: 'ahps_delete', label: 'Delete' },
    ],
  },
];

export const RECEPTIONIST_PAGE_KEYS = RECEPTIONIST_PERMISSION_GROUPS
  .map((group) => group.pageKey);

export const RECEPTIONIST_PATH_PAGE_KEYS = {
  '/patients': 'patients_page',
  '/conferences': 'conferences_page',
  '/appointments': 'appointments_page',
  '/join-time-report': 'conferences_page',
  '/tasks': 'tasks_page',
  '/gps': 'gps_page',
  '/ahps': 'ahps_page',
};

export const RECEPTIONIST_PERMISSION_KEYS = [
  ...RECEPTIONIST_PAGE_KEYS,
  ...RECEPTIONIST_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.key)),
];

export const DEFAULT_RECEPTIONIST_PERMISSIONS = Object.fromEntries(
  RECEPTIONIST_PERMISSION_KEYS.map((key) => [key, true]),
);

export const normalizeReceptionistPermissions = (raw) => {
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.fromEntries(
    RECEPTIONIST_PERMISSION_KEYS.map((key) => [key, source[key] !== false]),
  );
};

export const getReceptionistPageKeyForPath = (pathname = '') => {
  const match = Object.keys(RECEPTIONIST_PATH_PAGE_KEYS)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? RECEPTIONIST_PATH_PAGE_KEYS[match] : null;
};
