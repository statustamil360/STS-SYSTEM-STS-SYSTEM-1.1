/** Dispatches a browser event so the header can refresh the unread notification count. */
export const refreshNotificationBadge = () => {
  window.dispatchEvent(new CustomEvent('notifications:refresh'));
};

let scheduleRefreshTimer;

/** Live schedule events (appointments, conferences, meetings) — debounced so bursts refetch once. */
export const refreshSchedule = () => {
  window.clearTimeout(scheduleRefreshTimer);
  scheduleRefreshTimer = window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('schedule:refresh'));
  }, 50);
};

export const refreshSettingsLive = () => {
  window.dispatchEvent(new CustomEvent('settings:refresh'));
};
