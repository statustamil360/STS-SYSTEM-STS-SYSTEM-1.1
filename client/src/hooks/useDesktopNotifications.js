import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { refreshNotificationBadge, refreshSchedule, refreshSettingsLive } from '../utils/notificationRefresh';
import {
  getNotificationSocketUrl,
  loadShownNotificationIds,
  requestDesktopNotificationPermission,
  saveShownNotificationIds,
  showDesktopNotification,
} from '../utils/desktopNotifications';

const useDesktopNotifications = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const shownRef = useRef(loadShownNotificationIds());
  const primedRef = useRef(false);

  const present = useCallback((item) => {
    const id = Number(item?.id);
    if (!id || shownRef.current.has(id)) return;
    shownRef.current.add(id);
    saveShownNotificationIds(shownRef.current);
    showDesktopNotification(item, () => navigate('/notifications'));
    refreshNotificationBadge();
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return undefined;
    requestDesktopNotificationPermission();

    const onFirstGesture = () => {
      requestDesktopNotificationPermission();
      window.removeEventListener('click', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('click', onFirstGesture);
    window.addEventListener('keydown', onFirstGesture);

    return () => {
      window.removeEventListener('click', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const token = localStorage.getItem('accessToken');
    if (!token) return undefined;

    const socket = io(getNotificationSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socket.on('notification', (payload) => {
      present(payload);
    });
    socket.on('schedule-changed', () => {
      refreshSchedule();
      refreshNotificationBadge();
    });
    socket.on('settings-changed', () => {
      refreshSettingsLive();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, present]);

  useEffect(() => {
    if (!user?.id) return undefined;
    primedRef.current = false;

    const poll = async () => {
      try {
        const { data } = await api.get('/notifications?unread_only=true&limit=10');
        const rows = data.data || [];
        if (!primedRef.current) {
          primedRef.current = true;
          rows.forEach((row) => shownRef.current.add(Number(row.id)));
          saveShownNotificationIds(shownRef.current);
          return;
        }
        rows.forEach(present);
      } catch {
        // Keep the in-app badge poll as the fallback if this request fails.
      }
    };

    poll();
    const timer = setInterval(poll, 20000);
    return () => clearInterval(timer);
  }, [user?.id, present]);
};

export default useDesktopNotifications;
