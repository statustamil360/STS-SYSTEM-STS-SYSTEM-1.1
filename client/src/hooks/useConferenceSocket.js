import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

const normalizeHandlers = (second, third) => {
  if (second && typeof second === 'object') return second;
  return {
    onReportUpdated: second,
    onConferenceEnded: third,
  };
};

const useConferenceSocket = (conferenceId, second, third) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(normalizeHandlers(second, third));
  handlersRef.current = normalizeHandlers(second, third);

  useEffect(() => {
    if (!conferenceId) return undefined;

    const token = localStorage.getItem('accessToken');
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-conference', { conferenceId });
    });

    socket.on('report-updated', (payload) => {
      handlersRef.current.onReportUpdated?.(payload);
    });

    socket.on('report-typing', (payload) => {
      handlersRef.current.onReportTyping?.(payload);
    });

    socket.on('report-draft', (payload) => {
      handlersRef.current.onReportDraft?.(payload);
    });

    socket.on('conference-ended', (payload) => {
      handlersRef.current.onConferenceEnded?.(payload);
    });

    socket.on('recording-flush', (payload) => {
      handlersRef.current.onRecordingFlush?.(payload);
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

  const emitReportTyping = ({ reportUserId, section, typing }) => {
    socketRef.current?.emit('report-typing', {
      conferenceId,
      reportUserId,
      section,
      typing,
    });
  };

  const emitReportDraft = ({ reportUserId, section, content }) => {
    socketRef.current?.emit('report-draft', {
      conferenceId,
      reportUserId,
      section,
      content,
    });
  };

  return { emitReportUpdate, emitReportTyping, emitReportDraft };
};

export default useConferenceSocket;
