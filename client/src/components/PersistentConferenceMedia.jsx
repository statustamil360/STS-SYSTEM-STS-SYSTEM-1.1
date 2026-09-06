import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import {
  CallEndOutlined, ExitToAppOutlined, MicOffOutlined, MicOutlined,
  OpenInFullOutlined, VideocamOffOutlined, VideocamOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useConferenceSession } from '../context/ConferenceSessionContext';
import useMediasoupConference from '../hooks/useMediasoupConference';
import useConferenceSocket from '../hooks/useConferenceSocket';
import JitsiVideoRoom from './JitsiVideoRoom';
import WebRTCVideoRoom from './WebRTCVideoRoom';
import { ROLES } from '../utils/constants';

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
    endSession,
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
  const patientName = session?.patientName || roomInfo?.patientName || roomInfo?.conference?.patient_name || '';
  const isGp = currentUser?.role === ROLES.GP;
  const jitsiEmail = currentUser?.email || (currentUser?.id ? `user-${currentUser.id}@sts.local` : undefined);
  const jitsiRef = useRef(null);

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
    enabled: Boolean(roomInfo && !isJitsi && (roomInfo.provider === 'webrtc' || roomInfo.iceServers)),
  });

  useConferenceSocket(conferenceId, null, handleRemoteEnded);

  useEffect(() => {
    registerMediaApi({
      leaveVideo,
      toggleMic,
      toggleCam,
      hangupJitsi: () => jitsiRef.current?.hangup(),
      endJitsi: () => jitsiRef.current?.endConference(),
    });
  }, [registerMediaApi, leaveVideo, toggleMic, toggleCam]);

  useEffect(() => {
    setMediaState({
      videoStatus,
      videoError,
      micOn,
      camOn,
      remotePeerCount: remotePeers.length,
    });
  }, [setMediaState, videoStatus, videoError, micOn, camOn, remotePeers.length]);

  const [slotRect, setSlotRect] = useState(null);

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

  if (!session || !roomInfo) return null;

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
    }
    : showMiniPopup
      ? {
        bottom: 24,
        right: 24,
        width: { xs: 280, sm: 340 },
        height: { xs: 188, sm: 220 },
        borderRadius: 3,
        boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(255,255,255,0.12)',
      }
      : {
        top: -9999,
        left: -9999,
        width: 720,
        height: 480,
      };

  return (
    <Box
      sx={{
        position: 'fixed',
        zIndex: isDocked ? 1200 : 1400,
        overflow: 'hidden',
        bgcolor: '#0f172a',
        visibility: isDocked || showMiniPopup ? 'visible' : 'hidden',
        pointerEvents: isDocked || showMiniPopup ? 'auto' : 'none',
        ...frameSx,
        transition: 'top 180ms ease, left 180ms ease, width 180ms ease, height 180ms ease, border-radius 180ms ease',
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
            isHost={isGp}
            onJoined={() => setJitsiLive(true)}
            onLeft={leaveSession}
            onEndMeeting={endSession}
            onParticipantCount={setJitsiParticipants}
          />
        ) : (
          <WebRTCVideoRoom
            localStream={localStream}
            remotePeers={remotePeers}
            displayName={roomInfo?.displayName}
            userRole={currentUser?.role}
          />
        )}
      </Box>

      {showMiniPopup && (
        <Box
          onClick={restoreSession}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.18) 42%, rgba(15,23,42,0.78) 100%)',
            cursor: 'pointer',
            p: 1.25,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {showLive && <LiveDot />}
            <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 700 }}>
              {showLive ? 'Live meeting' : videoConnecting ? 'Connecting…' : 'In meeting'}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); restoreSession(); }}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.12)' }}
            >
              <OpenInFullOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Box>
            <Typography variant="body2" sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.3 }} noWrap>
              {patientName || 'Clinical Video Conference'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Click to return to the meeting
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
              {!isJitsi && (
                <>
                  <IconButton
                    size="small"
                    onClick={toggleMic}
                    sx={{ bgcolor: micOn ? 'rgba(255,255,255,0.16)' : 'error.main', color: 'common.white' }}
                  >
                    {micOn ? <MicOutlined sx={{ fontSize: 16 }} /> : <MicOffOutlined sx={{ fontSize: 16 }} />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={toggleCam}
                    sx={{ bgcolor: camOn ? 'rgba(255,255,255,0.16)' : 'error.main', color: 'common.white' }}
                  >
                    {camOn ? <VideocamOutlined sx={{ fontSize: 16 }} /> : <VideocamOffOutlined sx={{ fontSize: 16 }} />}
                  </IconButton>
                </>
              )}
              {isGp ? (
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  startIcon={<CallEndOutlined />}
                  onClick={endSession}
                  sx={{ ml: 'auto', minWidth: 0, px: 1.25, fontWeight: 700 }}
                >
                  End
                </Button>
              ) : (
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  startIcon={<ExitToAppOutlined />}
                  onClick={leaveSession}
                  sx={{ ml: 'auto', minWidth: 0, px: 1.25, fontWeight: 700 }}
                >
                  Leave
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PersistentConferenceMedia;
