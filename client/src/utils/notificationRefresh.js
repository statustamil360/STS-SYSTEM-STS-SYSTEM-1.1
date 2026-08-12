/** Dispatches a browser event so the header can refresh the unread notification count. */
export const refreshNotificationBadge = () => {
  window.dispatchEvent(new CustomEvent('notifications:refresh'));
};
