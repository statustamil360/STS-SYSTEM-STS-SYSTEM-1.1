import { Box, Chip, Typography } from '@mui/material';
import { MicOffOutlined, MicOutlined, VideocamOffOutlined, VideocamOutlined } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { applySpeakerSink } from '../utils/mediaDevices';

const VideoTile = ({ stream, label, role, isLocal = false, compact = false, micOn = true, camOn = true }) => {
  const videoRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return undefined;

    const refresh = () => {
      const liveVideo = Boolean(stream?.getVideoTracks?.().length);
      setHasVideo(liveVideo);
      if (stream) {
        videoEl.srcObject = stream;
        if (!isLocal) applySpeakerSink(videoEl);
        videoEl.play().catch(() => {});
      }
    };

    if (!stream) {
      videoEl.srcObject = null;
      setHasVideo(false);
      return undefined;
    }

    const bindTrack = (track) => {
      track.addEventListener('unmute', refresh);
      track.addEventListener('mute', refresh);
      track.addEventListener('ended', refresh);
    };

    const onAddTrack = (event) => {
      bindTrack(event.track);
      refresh();
    };

    stream.getTracks().forEach(bindTrack);
    stream.addEventListener('addtrack', onAddTrack);
    stream.addEventListener('removetrack', refresh);
    refresh();

    return () => {
      stream.removeEventListener('addtrack', onAddTrack);
      stream.removeEventListener('removetrack', refresh);
      stream.getTracks().forEach((track) => {
        track.removeEventListener('unmute', refresh);
        track.removeEventListener('mute', refresh);
        track.removeEventListener('ended', refresh);
      });
    };
  }, [stream, isLocal]);

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: '#0f172a',
        borderRadius: compact ? 0 : 2,
        overflow: 'hidden',
        height: '100%',
        minHeight: 0,
        border: compact ? 'none' : isLocal ? '2px solid' : '1px solid',
        borderColor: isLocal ? 'primary.main' : 'divider',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: hasVideo ? 1 : 0,
        }}
      />
      {!hasVideo && (
        <Box sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'grey.400',
        }}
        >
          <Typography variant="h5" fontWeight={700}>
            {(label || '?').charAt(0).toUpperCase()}
          </Typography>
        </Box>
      )}
      {!compact && (
        <Box sx={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap', maxWidth: '70%' }}>
          <Chip
            size="small"
            label={label || 'Participant'}
            sx={{ bgcolor: 'rgba(15,23,42,0.82)', color: 'common.white', fontWeight: 600 }}
          />
          {role && (
            <Chip
              size="small"
              label={role.toUpperCase()}
              sx={{ bgcolor: 'rgba(37,99,235,0.9)', color: 'common.white', fontWeight: 700 }}
            />
          )}
          {isLocal && (
            <Chip size="small" label="You" sx={{ bgcolor: 'rgba(34,197,94,0.9)', color: 'common.white', fontWeight: 700 }} />
          )}
          {isLocal && (
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: micOn ? 'rgba(255,255,255,0.92)' : 'error.main',
                color: micOn ? '#0f172a' : '#fff',
              }}
            >
              {micOn ? <MicOutlined sx={{ fontSize: 15 }} /> : <MicOffOutlined sx={{ fontSize: 15 }} />}
            </Box>
          )}
          {isLocal && (
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: camOn ? 'rgba(255,255,255,0.92)' : 'error.main',
                color: camOn ? '#0f172a' : '#fff',
              }}
            >
              {camOn ? <VideocamOutlined sx={{ fontSize: 15 }} /> : <VideocamOffOutlined sx={{ fontSize: 15 }} />}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const WebRTCVideoRoom = ({ localStream, remotePeers, displayName, userRole, compact = false, micOn = true, camOn = true }) => {
  const total = 1 + remotePeers.length;
  const columns = compact ? 1 : total <= 1 ? 1 : total <= 4 ? 2 : 3;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: compact ? 0 : 1,
        p: compact ? 0 : 1,
        height: '100%',
        overflow: compact ? 'hidden' : 'hidden',
        alignContent: 'stretch',
      }}
    >
      <VideoTile
        stream={localStream}
        label={displayName || 'You'}
        role={userRole}
        isLocal
        compact={compact}
        micOn={micOn}
        camOn={camOn}
      />
      {!compact && remotePeers.map((peer) => (
        <VideoTile
          key={`${peer.peerId}-${peer.videoTrackCount || 0}`}
          stream={peer.stream}
          label={peer.displayName}
          role={peer.role}
        />
      ))}
    </Box>
  );
};

export default WebRTCVideoRoom;
