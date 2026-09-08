import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  ExitToAppOutlined, MicOffOutlined, MicOutlined,
  OpenInFullOutlined, VideocamOffOutlined, VideocamOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useConferenceSession } from '../context/ConferenceSessionContext';
import useMediasoupConference from '../hooks/useMediasoupConference';
import useMeetingRecorder from '../hooks/useMeetingRecorder';
import useConferenceSocket from '../hooks/useConferenceSocket';
import { canJoinVideoRoom } from '../utils/constants';
import JitsiVideoRoom from './JitsiVideoRoom';
import WebRTCVideoRoom from './WebRTCVideoRoom';

const MINI_W = 320;
const MINI_H = 216;
const MINI_PAD = 16;
const DRAG_THRESHOLD = 6;

const clampMiniPos = (left, top) => {
  const maxLeft = Math.max(MINI_PAD, window.innerWidth - MINI_W - MINI_PAD);
  const maxTop = Math.max(MINI_PAD, window.innerHeight - MINI_H - MINI_PAD);
  return {
    left: Math.min(Math.max(MINI_PAD, left), maxLeft),
    top: Math.min(Math.max(MINI_PAD, top), maxTop),
  };
};

const defaultMiniPos = () => clampMiniPos(
  window.innerWidth - MINI_W - MINI_PAD,
  window.innerHeight - MINI_H - MINI_PAD - 88,
);

const controlBtnSx = {
  width: 36,
  height: 36,
  borderRadius: '10px',
  color: 'common.white',
  flexShrink: 0,
};

const LiveDot = () => (
  <Box
    sx={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      bgcolor: 'error.main',
      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.65)',
      animation: 'stsLivePulse 1.6s ease-out infinite',
      '@keyframes stsLivePulse': {
        '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.65)' },
        '70%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
      },
    }}
  />
);

const PersistentConferenceMedia = () => {
  const {
    session,
    minimized,
    roomViewActive,
    videoSlotEl,
    jitsiLive,
    setJitsiLive,
    setJitsiParticipants,
    registerMediaApi,
    restoreSession,
    leaveSession,
    handleRemoteEnded,
    showMiniPopup,
    setMediaState,
    user,
  } = useConferenceSession();
  const { user: authUser } = useSelector((state) => state.auth);
  const currentUser = user || authUser;

  const conferenceId = session?.conferenceId;
  const roomInfo = session?.roomInfo;
  const isJitsi = roomInfo?.provider === 'jitsi';
  const isVideoParticipant = canJoinVideoRoom(currentUser?.role);
  const patientName = session?.patientName || roomInfo?.patientName || roomInfo?.conference?.patient_name || '';
  const jitsiEmail = currentUser?.email || (currentUser?.id ? `user-${currentUser.id}@sts.local` : undefined);
  const jitsiRef = useRef(null);
  const frameRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const draggingRef = useRef(false);

  const [slotRect, setSlotRect] = useState(null);
  const [miniPos, setMiniPos] = useState(null);
  const [dragging, setDragging] = useState(false);

  const {
    status: videoStatus,
    error: videoError,
    localStream,
    remotePeers,
    micOn,
    camOn,
    toggleMic,
    toggleCam,
    leave: leaveVideo,
  } = useMediasoupConference({
    conferenceId,
    iceServers: roomInfo?.iceServers,
    displayName: roomInfo?.displayName || currentUser?.full_name || currentUser?.username,
    enabled: Boolean(isVideoParticipant && roomInfo && !isJitsi && (roomInfo.provider === 'webrtc' || roomInfo.iceServers)),
  });

  const recordMeeting = Boolean(roomInfo?.recordMeeting || roomInfo?.conference?.record_meeting);
  const { flush: flushRecording } = useMeetingRecorder({
    conferenceId,
    enabled: Boolean(isVideoParticipant && recordMeeting && !isJitsi && conferenceId),
    localStream,
    remotePeers,
  });

  useConferenceSocket(conferenceId, {
    onConferenceEnded: handleRemoteEnded,
    onRecordingFlush: () => { void flushRecording(); },
  });

  useEffect(() => {
    registerMediaApi({
      leaveVideo,
      toggleMic,
      toggleCam,
      hangupJitsi: () => jitsiRef.current?.hangup(),
      endJitsi: () => jitsiRef.current?.endConference(),
      flushRecording,
    });
  }, [registerMediaApi, leaveVideo, toggleMic, toggleCam, flushRecording]);

  useEffect(() => {
    setMediaState({
      videoStatus,
      videoError,
      micOn,
      camOn,
      remotePeerCount: remotePeers.length,
    });
  }, [setMediaState, videoStatus, videoError, micOn, camOn, remotePeers.length]);

  useEffect(() => {
    if (!currentUser?.role || isVideoParticipant || !session) return undefined;
    leaveSession();
    return undefined;
  }, [session, isVideoParticipant, leaveSession, currentUser?.role]);

  useLayoutEffect(() => {
    if (!roomViewActive || !videoSlotEl || minimized) {
      setSlotRect(null);
      return undefined;
    }

    const update = () => {
      const rect = videoSlotEl.getBoundingClientRect();
      setSlotRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(videoSlotEl);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [roomViewActive, videoSlotEl, minimized]);

  useLayoutEffect(() => {
    if (!showMiniPopup) return;
    setMiniPos((prev) => (prev ? clampMiniPos(prev.left, prev.top) : defaultMiniPos()));
  }, [showMiniPopup]);

  useEffect(() => {
    if (!showMiniPopup) return undefined;
    const onResize = () => {
      setMiniPos((prev) => (prev ? clampMiniPos(prev.left, prev.top) : defaultMiniPos()));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [showMiniPopup]);

  const beginDrag = useCallback((event) => {
    if (!showMiniPopup) return;
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest?.('[data-mini-control]')) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    didDragRef.current = false;
    draggingRef.current = true;
    setDragging(true);
  }, [showMiniPopup]);

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event) => {
      if (!draggingRef.current) return;
      const next = clampMiniPos(
        event.clientX - dragOffsetRef.current.x,
        event.clientY - dragOffsetRef.current.y,
      );
      const origin = frameRef.current?.getBoundingClientRect();
      if (origin) {
        const moved = Math.abs(next.left - origin.left) > DRAG_THRESHOLD
          || Math.abs(next.top - origin.top) > DRAG_THRESHOLD;
        if (moved) didDragRef.current = true;
      }
      setMiniPos(next);
    };

    const onUp = () => {
      const shouldRestore = draggingRef.current && !didDragRef.current;
      draggingRef.current = false;
      setDragging(false);
      if (shouldRestore) restoreSession();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, restoreSession]);

  if (!session || !roomInfo || !isVideoParticipant) return null;

  const isDocked = roomViewActive && slotRect && !minimized;
  const videoConnecting = !isJitsi && (videoStatus === 'connecting' || (videoStatus === 'idle' && roomInfo?.iceServers));
  const showLive = isJitsi ? jitsiLive : videoStatus === 'connected';
  const frameSx = isDocked
    ? {
      top: slotRect.top,
      left: slotRect.left,
      width: slotRect.width,
      height: slotRect.height,
      borderRadius: 0,
      boxShadow: 'none',
      border: 'none',
    }
    : showMiniPopup
      ? {
        top: miniPos?.top ?? defaultMiniPos().top,
        left: miniPos?.left ?? defaultMiniPos().left,
        width: MINI_W,
        height: MINI_H,
        borderRadius: '16px',
        boxShadow: '0 22px 48px rgba(15, 23, 42, 0.42), 0 0 0 1px rgba(255,255,255,0.06)',
        border: '1.5px solid rgba(45, 212, 191, 0.45)',
      }
      : {
        top: -9999,
        left: -9999,
        width: 720,
        height: 480,
      };

  return (
    <Box
      ref={frameRef}
      sx={{
        position: 'fixed',
        zIndex: isDocked ? 1200 : 1400,
        overflow: 'hidden',
        bgcolor: '#0f172a',
        visibility: isDocked || showMiniPopup ? 'visible' : 'hidden',
        pointerEvents: isDocked || showMiniPopup ? 'auto' : 'none',
        userSelect: showMiniPopup ? 'none' : 'auto',
        touchAction: showMiniPopup ? 'none' : 'auto',
        cursor: showMiniPopup ? (dragging ? 'grabbing' : 'grab') : 'default',
        ...frameSx,
        transition: dragging || isDocked
          ? 'none'
          : 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease, border-radius 180ms ease',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0 }}>
        {isJitsi ? (
          <JitsiVideoRoom
            ref={jitsiRef}
            domain={roomInfo?.jitsiDomain}
            roomName={roomInfo?.roomId}
            displayName={roomInfo?.displayName}
            patientName={patientName}
            jitsiUrl={roomInfo?.jitsiUrl}
            userEmail={jitsiEmail}
            isHost={false}
            onJoined={() => setJitsiLive(true)}
            onLeft={leaveSession}
            onEndMeeting={leaveSession}
            onParticipantCount={setJitsiParticipants}
          />
        ) : (
          <WebRTCVideoRoom
            localStream={localStream}
            remotePeers={remotePeers}
            displayName={roomInfo?.displayName}
            userRole={currentUser?.role}
            compact={showMiniPopup}
            micOn={micOn}
            camOn={camOn}
          />
        )}
      </Box>

      {isDocked && !isJitsi && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 12,
            justifyContent: 'center',
            zIndex: 6,
            pointerEvents: 'auto',
          }}
        >
          <Tooltip title={micOn ? 'Mute microphone' : 'Unmute microphone'}>
            <IconButton
              onClick={toggleMic}
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                bgcolor: micOn ? '#ffffff' : 'error.main',
                color: micOn ? '#0f172a' : '#ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                '&:hover': { bgcolor: micOn ? '#f1f5f9' : 'error.dark' },
              }}
            >
              {micOn ? <MicOutlined /> : <MicOffOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title={camOn ? 'Turn camera off' : 'Turn camera on'}>
            <IconButton
              onClick={toggleCam}
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                bgcolor: camOn ? '#ffffff' : 'error.main',
                color: camOn ? '#0f172a' : '#ffffff',
                boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                '&:hover': { bgcolor: camOn ? '#f1f5f9' : 'error.dark' },
              }}
            >
              {camOn ? <VideocamOutlined /> : <VideocamOffOutlined />}
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {showMiniPopup && (
        <Box
          onPointerDown={beginDrag}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.22) 38%, rgba(15,23,42,0.88) 100%)',
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ px: 1.25, pt: 1.1, pb: 0.5 }}
          >
            {showLive && <LiveDot />}
            {recordMeeting && (
              <Typography variant="caption" sx={{ color: 'error.light', fontWeight: 800, letterSpacing: 0.6 }}>
                REC
              </Typography>
            )}
            <Typography
              variant="caption"
              sx={{ color: 'common.white', fontWeight: 700, letterSpacing: 0.2, lineHeight: 1 }}
            >
              {showLive ? 'Live meeting' : videoConnecting ? 'Connecting…' : 'In meeting'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              data-mini-control
              size="small"
              aria-label="Return to meeting"
              onClick={(e) => { e.stopPropagation(); restoreSession(); }}
              sx={{
                ...controlBtnSx,
                width: 32,
                height: 32,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
              }}
            >
              <OpenInFullOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0 }} />

          <Box
            sx={{
              px: 1.25,
              pb: 1.1,
              pt: 1,
              background: 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.92) 28%)',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.25, pr: 0.5 }}
              noWrap
            >
              {patientName || 'Clinical Video Conference'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.68)', display: 'block', mb: 1, lineHeight: 1.3 }}>
              Drag to move · click to return
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              data-mini-control
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {!isJitsi && (
                <>
                  <IconButton
                    size="small"
                    aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                    onClick={toggleMic}
                    sx={{
                      ...controlBtnSx,
                      bgcolor: micOn ? 'rgba(255,255,255,0.14)' : 'error.main',
                      '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.24)' : 'error.dark' },
                    }}
                  >
                    {micOn ? <MicOutlined sx={{ fontSize: 18 }} /> : <MicOffOutlined sx={{ fontSize: 18 }} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
                    onClick={toggleCam}
                    sx={{
                      ...controlBtnSx,
                      bgcolor: camOn ? 'rgba(255,255,255,0.14)' : 'error.main',
                      '&:hover': { bgcolor: camOn ? 'rgba(255,255,255,0.24)' : 'error.dark' },
                    }}
                  >
                    {camOn ? <VideocamOutlined sx={{ fontSize: 18 }} /> : <VideocamOffOutlined sx={{ fontSize: 18 }} />}
                  </IconButton>
                </>
              )}
              <Button
                size="small"
                color="error"
                variant="contained"
                startIcon={<ExitToAppOutlined sx={{ fontSize: 18 }} />}
                onClick={leaveSession}
                sx={{
                  ml: 'auto',
                  height: 36,
                  minHeight: 36,
                  minWidth: 0,
                  px: 1.5,
                  py: 0,
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: 13,
                  lineHeight: 1,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '& .MuiButton-startIcon': { mr: 0.75, ml: 0 },
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Leave
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PersistentConferenceMedia;
