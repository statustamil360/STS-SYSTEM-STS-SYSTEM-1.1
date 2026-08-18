import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

const useConferenceSocket = (conferenceId, onReportUpdated) => {
  const socketRef = useRef(null);
  const handlerRef = useRef(onReportUpdated);
  handlerRef.current = onReportUpdated;

  useEffect(() => {
    if (!conferenceId) return undefined;

    const token = localStorage.getItem('accessToken');
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-conference', { conferenceId });
    });

    socket.on('report-updated', (payload) => {
      handlerRef.current?.(payload);
    });

    return () => {
      socket.emit('leave-conference', { conferenceId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conferenceId]);

  const emitReportUpdate = (report) => {
    socketRef.current?.emit('report-update', { conferenceId, report });
  };

  return { emitReportUpdate };
};

export default useConferenceSocket;
