import { Box, Chip, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { applySpeakerSink } from '../utils/mediaDevices';

const VideoTile = ({ stream, label, role, isLocal = false }) => {
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
        borderRadius: 2,
        overflow: 'hidden',
        aspectRatio: '16/10',
        border: isLocal ? '2px solid' : '1px solid',
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
      <Box sx={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 0.5 }}>
        <Chip
          size="small"
          label={label || 'Participant'}
          sx={{ bgcolor: 'rgba(15,23,42,0.75)', color: 'common.white', fontWeight: 600 }}
        />
        {role && (
          <Chip
            size="small"
            label={role.toUpperCase()}
            sx={{ bgcolor: 'rgba(37,99,235,0.85)', color: 'common.white', fontWeight: 600 }}
          />
        )}
        {isLocal && (
          <Chip size="small" label="You" sx={{ bgcolor: 'rgba(34,197,94,0.85)', color: 'common.white' }} />
        )}
      </Box>
    </Box>
  );
};

const WebRTCVideoRoom = ({ localStream, remotePeers, displayName, userRole }) => {
  const total = 1 + remotePeers.length;
  const columns = total <= 1 ? 1 : total <= 4 ? 2 : 3;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 1.5,
        p: 1.5,
        height: '100%',
        overflow: 'auto',
        alignContent: 'start',
      }}
    >
      <VideoTile
        stream={localStream}
        label={displayName || 'You'}
        role={userRole}
        isLocal
      />
      {remotePeers.map((peer) => (
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
