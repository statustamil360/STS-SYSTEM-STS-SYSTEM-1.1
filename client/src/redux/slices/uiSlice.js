import { createSlice } from '@reduxjs/toolkit';
import { readDashboardPrefs, writeDashboardPrefs } from '../../utils/dashboardPreferences';

const calendarPopupKey = (userId) => `calendar_popup_${userId}`;
const todoPopupKey = (userId) => `todo_popup_${userId}`;

const persistDashboardPrefs = (userId, patch) => {
  if (!userId) return;
  writeDashboardPrefs(userId, { ...readDashboardPrefs(userId), ...patch });
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    darkMode: localStorage.getItem('theme') === 'dark',
    calendarPopupEnabled: true,
    todoPopupEnabled: true,
    conferencePopupEnabled: true,
    taskAlertsEnabled: true,
    dashboardCards: {},
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('theme', action.payload ? 'dark' : 'light');
    },
    hydrateCalendarPopup: (state, action) => {
      const userId = action.payload;
      const raw = userId ? localStorage.getItem(calendarPopupKey(userId)) : null;
      state.calendarPopupEnabled = raw !== 'false';
    },
    setCalendarPopupEnabled: (state, action) => {
      const { enabled, userId } = action.payload;
      state.calendarPopupEnabled = Boolean(enabled);
      if (userId) {
        localStorage.setItem(calendarPopupKey(userId), String(Boolean(enabled)));
      }
    },
    hydrateTodoPopup: (state, action) => {
      const userId = action.payload;
      const raw = userId ? localStorage.getItem(todoPopupKey(userId)) : null;
      state.todoPopupEnabled = raw !== 'false';
    },
    setTodoPopupEnabled: (state, action) => {
      const { enabled, userId } = action.payload;
      state.todoPopupEnabled = Boolean(enabled);
      if (userId) {
        localStorage.setItem(todoPopupKey(userId), String(Boolean(enabled)));
      }
    },
    hydrateDashboardPrefs: (state, action) => {
      const prefs = readDashboardPrefs(action.payload);
      state.conferencePopupEnabled = prefs.conferencePopup;
      state.taskAlertsEnabled = prefs.taskAlerts;
      state.dashboardCards = prefs.cards;
    },
    setConferencePopupEnabled: (state, action) => {
      const { enabled, userId } = action.payload;
      state.conferencePopupEnabled = Boolean(enabled);
      persistDashboardPrefs(userId, { conferencePopup: Boolean(enabled) });
    },
    setTaskAlertsEnabled: (state, action) => {
      const { enabled, userId } = action.payload;
      state.taskAlertsEnabled = Boolean(enabled);
      persistDashboardPrefs(userId, { taskAlerts: Boolean(enabled) });
    },
    setDashboardCardEnabled: (state, action) => {
      const { key, enabled, userId } = action.payload;
      state.dashboardCards[key] = Boolean(enabled);
      if (userId) {
        const prefs = readDashboardPrefs(userId);
        persistDashboardPrefs(userId, { cards: { ...prefs.cards, [key]: Boolean(enabled) } });
      }
    },
  },
});

export const {
  toggleSidebar, setSidebarOpen, toggleDarkMode, setDarkMode,
  hydrateCalendarPopup, setCalendarPopupEnabled,
  hydrateTodoPopup, setTodoPopupEnabled,
  hydrateDashboardPrefs, setConferencePopupEnabled, setTaskAlertsEnabled, setDashboardCardEnabled,
} = uiSlice.actions;
export default uiSlice.reducer;
