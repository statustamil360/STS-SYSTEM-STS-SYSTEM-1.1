import { Box, Chip, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

const VideoTile = ({ stream, label, role, isLocal = false }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;
    if (!stream) {
      if (videoEl) videoEl.srcObject = null;
      if (audioEl) audioEl.srcObject = null;
      return undefined;
    }

    const hasVideo = stream.getVideoTracks().some((t) => t.readyState === 'live');
    if (hasVideo && videoEl) {
      videoEl.srcObject = stream;
    } else if (audioEl) {
      audioEl.srcObject = stream;
    }

    return () => {
      if (videoEl) videoEl.srcObject = null;
      if (audioEl) audioEl.srcObject = null;
    };
  }, [stream]);

  const hasVideo = stream?.getVideoTracks?.().some((t) => t.enabled && t.readyState === 'live');

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
          display: hasVideo ? 'block' : 'none',
        }}
      />
      {!hasVideo && (
        <>
          <audio ref={audioRef} autoPlay playsInline />
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: 'grey.400' }}>
            <Typography variant="h5" fontWeight={700}>
              {(label || '?').charAt(0).toUpperCase()}
            </Typography>
          </Box>
        </>
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
          key={peer.peerId}
          stream={peer.stream}
          label={peer.displayName}
          role={peer.role}
        />
      ))}
    </Box>
  );
};

export default WebRTCVideoRoom;
