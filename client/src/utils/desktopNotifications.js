const SHOWN_KEY = 'sts-shown-notification-ids';

export const getNotificationSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

export const loadShownNotificationIds = () => {
  try {
    const raw = sessionStorage.getItem(SHOWN_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
};

export const saveShownNotificationIds = (ids) => {
  const list = [...ids].slice(-200);
  sessionStorage.setItem(SHOWN_KEY, JSON.stringify(list));
};

export const canUseDesktopNotifications = () => (
  typeof window !== 'undefined' && typeof Notification !== 'undefined'
);

export const requestDesktopNotificationPermission = async () => {
  if (!canUseDesktopNotifications()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
};

export const showDesktopNotification = (item, onClick) => {
  if (!canUseDesktopNotifications() || Notification.permission !== 'granted') return;
  if (!item?.title) return;
  try {
    const toast = new Notification(item.title, {
      body: item.message || '',
      tag: item.id ? `sts-notification-${item.id}` : `sts-notification-${Date.now()}`,
      icon: '/favicon.png',
      silent: false,
    });
    toast.onclick = () => {
      window.focus();
      onClick?.(item);
      toast.close();
    };
  } catch {
    // Browser or OS may block the toast even after permission is granted.
  }
};
