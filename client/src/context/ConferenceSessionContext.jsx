import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { ROLES } from '../utils/constants';

const ConferenceSessionContext = createContext(null);

const isGuestRole = (role) => role === ROLES.CONFERENCE_GUEST || role === 'conference_guest';

export const ConferenceSessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [session, setSession] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [roomViewActive, setRoomViewActive] = useState(false);
  const [videoSlotEl, setVideoSlotEl] = useState(null);
  const [isAssignedGp, setIsAssignedGp] = useState(false);
  const [jitsiLive, setJitsiLive] = useState(false);
  const [jitsiParticipants, setJitsiParticipants] = useState(1);
  const [mediaState, setMediaState] = useState({
    videoStatus: 'idle',
    videoError: null,
    micOn: true,
    camOn: true,
    remotePeerCount: 0,
  });

  const mediaApiRef = useRef({
    leaveVideo: () => {},
    toggleMic: () => {},
    toggleCam: () => {},
    hangupJitsi: () => {},
    endJitsi: () => {},
  });
  const leaveSentRef = useRef(false);
  const leavingRef = useRef(false);
  const endingRef = useRef(false);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const registerMediaApi = useCallback((apiFns) => {
    mediaApiRef.current = { ...mediaApiRef.current, ...apiFns };
  }, []);

  const registerVideoSlot = useCallback((el) => {
    setVideoSlotEl(el);
  }, []);

  const goAfterLeave = useCallback(() => {
    if (isGuestRole(user?.role)) {
      navigate('/conferences/thanks', { replace: true });
      return;
    }
    navigate('/conferences?tab=upcoming');
  }, [navigate, user?.role]);

  const recordLeave = useCallback(async (conferenceId) => {
    if (leaveSentRef.current || !conferenceId) return;
    leaveSentRef.current = true;
    try {
      await api.post(`/conferences/${conferenceId}/leave`);
    } catch {
      /* best-effort */
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setMinimized(false);
    setRoomViewActive(false);
    setVideoSlotEl(null);
    setJitsiLive(false);
    setJitsiParticipants(1);
    setMediaState({ videoStatus: 'idle', videoError: null, micOn: true, camOn: true, remotePeerCount: 0 });
    leaveSentRef.current = false;
    leavingRef.current = false;
    endingRef.current = false;
  }, []);

  const startSession = useCallback((nextSession) => {
    const prev = sessionRef.current;
    if (prev && String(prev.conferenceId) !== String(nextSession.conferenceId)) {
      mediaApiRef.current.hangupJitsi();
      mediaApiRef.current.leaveVideo();
      recordLeave(prev.conferenceId);
    }
    leaveSentRef.current = false;
    leavingRef.current = false;
    endingRef.current = false;
    setIsAssignedGp(Boolean(nextSession.isAssignedGp));
    setSession(nextSession);
    setMinimized(false);
    setRoomViewActive(true);
  }, [recordLeave]);

  const updateRoomInfo = useCallback((patch) => {
    setSession((prev) => (prev ? { ...prev, ...patch, roomInfo: { ...prev.roomInfo, ...patch.roomInfo } } : prev));
  }, []);

  const attachRoomView = useCallback(() => {
    setRoomViewActive(true);
    setMinimized(false);
  }, []);

  const detachRoomView = useCallback(() => {
    setRoomViewActive(false);
    setVideoSlotEl(null);
    if (sessionRef.current && !leavingRef.current && !endingRef.current) {
      setMinimized(true);
    }
  }, []);

  const restoreSession = useCallback(() => {
    const active = sessionRef.current;
    if (!active?.conferenceId) return;
    setMinimized(false);
    setRoomViewActive(true);
    navigate(`/conferences/${active.conferenceId}/room`, {
      state: active.roomInfo || null,
    });
  }, [navigate]);

  const leaveSession = useCallback(async () => {
    if (leavingRef.current || endingRef.current) return;
    leavingRef.current = true;
    const conferenceId = sessionRef.current?.conferenceId;
    mediaApiRef.current.hangupJitsi();
    mediaApiRef.current.leaveVideo();
    await recordLeave(conferenceId);
    clearSession();
    goAfterLeave();
  }, [clearSession, goAfterLeave, recordLeave]);

  const endSession = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    leavingRef.current = true;
    const conferenceId = sessionRef.current?.conferenceId;
    mediaApiRef.current.endJitsi();
    try {
      mediaApiRef.current.leaveVideo();
      await recordLeave(conferenceId);
      if (conferenceId) {
        await api.post(`/conferences/${conferenceId}/end`);
      }
      toast.success('Meeting ended — documents are being generated');
    } catch (err) {
      endingRef.current = false;
      leavingRef.current = false;
      toast.error(err.response?.data?.message || 'Failed to end meeting');
      return;
    }
    clearSession();
    navigate('/conferences?tab=documents');
  }, [clearSession, navigate, recordLeave]);

  const toggleMic = useCallback(() => {
    mediaApiRef.current.toggleMic();
  }, []);

  const toggleCam = useCallback(() => {
    mediaApiRef.current.toggleCam();
  }, []);

  const handleRemoteEnded = useCallback(() => {
    if (endingRef.current || leavingRef.current) return;
    toast.info('The host ended this meeting');
    leaveSession();
  }, [leaveSession]);

  useEffect(() => {
    if (isAuthenticated) return undefined;
    const active = sessionRef.current;
    if (!active) return undefined;
    mediaApiRef.current.hangupJitsi();
    mediaApiRef.current.leaveVideo();
    recordLeave(active.conferenceId);
    clearSession();
    return undefined;
  }, [isAuthenticated, clearSession, recordLeave]);

  const inRoomRoute = /^\/conferences\/[^/]+\/room\/?$/.test(location.pathname);
  const showMiniPopup = Boolean(session && minimized && !inRoomRoute);

  const value = useMemo(() => ({
    session,
    minimized,
    roomViewActive,
    videoSlotEl,
    isAssignedGp,
    setIsAssignedGp,
    jitsiLive,
    setJitsiLive,
    jitsiParticipants,
    setJitsiParticipants,
    mediaState,
    setMediaState,
    toggleMic,
    toggleCam,
    leavingRef,
    endingRef,
    registerMediaApi,
    registerVideoSlot,
    startSession,
    updateRoomInfo,
    attachRoomView,
    detachRoomView,
    restoreSession,
    leaveSession,
    endSession,
    handleRemoteEnded,
    showMiniPopup,
    user,
  }), [
    session, minimized, roomViewActive, videoSlotEl, isAssignedGp,
    jitsiLive, jitsiParticipants, mediaState, toggleMic, toggleCam,
    registerMediaApi, registerVideoSlot,
    startSession, updateRoomInfo, attachRoomView, detachRoomView,
    restoreSession, leaveSession, endSession, handleRemoteEnded, showMiniPopup, user,
  ]);

  return (
    <ConferenceSessionContext.Provider value={value}>
      {children}
    </ConferenceSessionContext.Provider>
  );
};

export const useConferenceSession = () => {
  const ctx = useContext(ConferenceSessionContext);
  if (!ctx) {
    throw new Error('useConferenceSession must be used within ConferenceSessionProvider');
  }
  return ctx;
};

export const useOptionalConferenceSession = () => useContext(ConferenceSessionContext);
