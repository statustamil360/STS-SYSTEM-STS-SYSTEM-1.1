import { ROLES } from './constants';

export const dashboardPrefsKey = (userId) => `dashboard_prefs_${userId}`;

export const STAT_ROW_KEY = 'stat_row';

export const DEFAULT_DASHBOARD_PREFS = {
  conferencePopup: true,
  taskAlerts: true,
  cards: {},
};

const STAT_ROW_OPTION = {
  key: STAT_ROW_KEY,
  label: 'Dashboard stat cards',
  description: 'Show or hide the top row of count cards on your dashboard.',
};

const SECTION_CARDS = {
  [ROLES.ADMIN]: [
    { key: 'section_next_meeting', label: 'Next meeting panel' },
    { key: 'section_appointments', label: "Today's appointments list" },
    { key: 'section_conferences', label: 'Recent conferences' },
    { key: 'section_join_time', label: 'Participant join time' },
    { key: 'section_quick_actions', label: 'Quick actions' },
    { key: 'section_analytics', label: 'Analytics snapshot' },
  ],
  [ROLES.RECEPTIONIST]: [
    { key: 'section_next_meeting', label: 'Next meeting panel' },
    { key: 'section_appointments', label: "Today's appointments list" },
    { key: 'section_conferences', label: 'Recent conferences' },
    { key: 'section_join_time', label: 'Participant join time' },
    { key: 'section_quick_actions', label: 'Quick actions' },
    { key: 'section_analytics', label: 'Analytics snapshot' },
  ],
  [ROLES.GP]: [
    { key: 'section_next_meeting', label: 'Next meeting panel' },
    { key: 'section_appointments', label: "Today's appointments list" },
    { key: 'section_conferences', label: 'Recent conferences' },
    { key: 'section_quick_actions', label: 'Quick actions' },
    { key: 'section_analytics', label: 'Analytics snapshot' },
  ],
  [ROLES.AHP]: [
    { key: 'section_next_meeting', label: 'Next meeting panel' },
    { key: 'section_appointments', label: "Today's appointments list" },
    { key: 'section_conferences', label: 'Recent conferences' },
    { key: 'section_quick_actions', label: 'Quick actions' },
    { key: 'section_analytics', label: 'Analytics snapshot' },
  ],
  [ROLES.SUPER_ADMIN]: [
    { key: 'section_quick_actions', label: 'Quick actions' },
    { key: 'section_analytics', label: 'Analytics snapshot' },
    { key: 'section_activity', label: 'Recent system activity' },
  ],
};

export const ROLE_DASHBOARD_CARDS = Object.fromEntries(
  Object.entries(SECTION_CARDS).map(([role, sections]) => [
    role,
    [STAT_ROW_OPTION, ...sections],
  ]),
);

export const isDashboardCardEnabled = (cards, key) => {
  if (!key || !String(key).startsWith('section_')) {
    return cards?.[STAT_ROW_KEY] !== false;
  }
  return cards?.[key] !== false;
};

export const readDashboardPrefs = (userId) => {
  if (!userId) return { ...DEFAULT_DASHBOARD_PREFS, cards: {} };
  try {
    const raw = localStorage.getItem(dashboardPrefsKey(userId));
    if (!raw) return { ...DEFAULT_DASHBOARD_PREFS, cards: {} };
    const parsed = JSON.parse(raw);
    return {
      conferencePopup: parsed.conferencePopup !== false,
      taskAlerts: parsed.taskAlerts !== false,
      cards: parsed.cards && typeof parsed.cards === 'object' ? parsed.cards : {},
    };
  } catch {
    return { ...DEFAULT_DASHBOARD_PREFS, cards: {} };
  }
};

export const writeDashboardPrefs = (userId, prefs) => {
  if (!userId) return;
  localStorage.setItem(dashboardPrefsKey(userId), JSON.stringify(prefs));
};
