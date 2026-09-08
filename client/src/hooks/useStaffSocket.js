import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { isMeetingHostRole } from '../utils/constants';

const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

const useStaffSocket = (user, handlers) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const isHost = isMeetingHostRole(user?.role);

  useEffect(() => {
    if (!isHost || !user?.id) return undefined;

    const token = localStorage.getItem('accessToken');
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socket.on('conference-empty', (payload) => {
      handlersRef.current.onEmpty?.(payload);
    });
    socket.on('conference-occupied', (payload) => {
      handlersRef.current.onOccupied?.(payload);
    });
    socket.on('conference-empty-continued', (payload) => {
      handlersRef.current.onContinued?.(payload);
    });
    socket.on('conference-ended', (payload) => {
      handlersRef.current.onEnded?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [isHost, user?.id]);
};

export default useStaffSocket;
