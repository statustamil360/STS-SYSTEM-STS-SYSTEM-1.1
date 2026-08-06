import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Button, Stack, Typography, IconButton, Paper, CircularProgress,
} from '@mui/material';
import {
  CallEndOutlined, MicOutlined, MicOffOutlined, VideocamOutlined, VideocamOffOutlined,
  ArrowBackOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DailyIframe from '@daily-co/daily-js';
import api from '../../services/api';
import { ROLES } from '../../utils/constants';

const ConferenceRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const callRef = useRef(null);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState(location.state || null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initRoom = async () => {
      try {
        let info = roomInfo;
        if (!info?.roomUrl) {
          const { data } = await api.post(`/conferences/${id}/join`);
          info = data.data;
          if (mounted) setRoomInfo(info);
        }

        if (info.provider === 'jitsi') {
          if (mounted) setLoading(false);
          return;
        }

        if (callRef.current) {
          await callRef.current.destroy();
          callRef.current = null;
        }

        const call = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
        });

        callRef.current = call;
        call.on('left-meeting', () => navigate('/conferences'));

        const joinOpts = info.token ? { url: info.roomUrl, token: info.token } : { url: info.roomUrl };
        await call.join(joinOpts);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join meeting room');
        navigate('/conferences');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initRoom();

    return () => {
      mounted = false;
      if (callRef.current) {
        callRef.current.destroy().catch(() => {});
        callRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLeave = async () => {
    try {
      if (callRef.current) {
        await callRef.current.leave();
        await callRef.current.destroy();
        callRef.current = null;
      }
      if (user?.role === ROLES.GP) {
        await api.post(`/conferences/${id}/end`);
      }
    } catch {
      // still navigate away
    }
    navigate('/conferences');
  };

  const toggleMic = async () => {
    if (!callRef.current) return;
    const next = !micOn;
    await callRef.current.setLocalAudio(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!callRef.current) return;
    const next = !camOn;
    await callRef.current.setLocalVideo(next);
    setCamOn(next);
  };

  if (!roomInfo && loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography mt={2} color="text.secondary">Connecting to meeting...</Typography>
      </Box>
    );
  }

  if (roomInfo?.provider === 'jitsi') {
    const displayName = user?.full_name || user?.username || 'Participant';
    const jitsiUrl = `${roomInfo.roomUrl}#userInfo.displayName="${encodeURIComponent(displayName)}"`;
    return (
      <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => navigate('/conferences')}><ArrowBackOutlined /></IconButton>
          <Typography variant="h6" fontWeight={700}>Video Conference</Typography>
        </Stack>
        <Paper elevation={0} sx={{ flex: 1, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <iframe
            title="Video conference"
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        </Paper>
        <Stack direction="row" justifyContent="center">
          <Button variant="contained" color="error" startIcon={<CallEndOutlined />} onClick={handleLeave}>
            Leave Meeting
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={handleLeave}><ArrowBackOutlined /></IconButton>
        <Typography variant="h6" fontWeight={700}>Video Conference</Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: '#0f172a',
          position: 'relative',
        }}
      >
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 1 }}>
            <CircularProgress color="inherit" sx={{ color: 'grey.400' }} />
          </Box>
        )}
        <Box ref={containerRef} sx={{ width: '100%', height: '100%' }} />
      </Paper>

      <Stack direction="row" justifyContent="center" spacing={2}>
        <IconButton
          onClick={toggleMic}
          disabled={loading}
          sx={{
            bgcolor: micOn ? 'background.paper' : 'error.main',
            color: micOn ? 'text.primary' : 'error.contrastText',
            '&:hover': { bgcolor: micOn ? 'grey.200' : 'error.dark' },
          }}
        >
          {micOn ? <MicOutlined /> : <MicOffOutlined />}
        </IconButton>
        <IconButton
          onClick={toggleCam}
          disabled={loading}
          sx={{
            bgcolor: camOn ? 'background.paper' : 'error.main',
            color: camOn ? 'text.primary' : 'error.contrastText',
            '&:hover': { bgcolor: camOn ? 'grey.200' : 'error.dark' },
          }}
        >
          {camOn ? <VideocamOutlined /> : <VideocamOffOutlined />}
        </IconButton>
        <Button variant="contained" color="error" startIcon={<CallEndOutlined />} onClick={handleLeave} disabled={loading}>
          Leave
        </Button>
      </Stack>
    </Box>
  );
};

export default ConferenceRoom;
