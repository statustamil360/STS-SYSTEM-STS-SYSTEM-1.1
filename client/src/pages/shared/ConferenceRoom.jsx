import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Button, Stack, Typography, IconButton, Paper, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import {
  MicOutlined, MicOffOutlined, VideocamOutlined, VideocamOffOutlined,
  ArrowBackOutlined, ExitToAppOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROLES } from '../../utils/constants';
import ConferenceReportPanel from '../../components/ConferenceReportPanel';
import { useConferenceSession } from '../../context/ConferenceSessionContext';

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

const ConferenceRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    session,
    startSession,
    updateRoomInfo,
    attachRoomView,
    detachRoomView,
    registerVideoSlot,
    leaveSession,
    isAssignedGp,
    setIsAssignedGp,
    jitsiLive,
    jitsiParticipants,
    mediaState,
    toggleMic,
    toggleCam,
  } = useConferenceSession();

  const [loading, setLoading] = useState(!session || String(session.conferenceId) !== String(id));
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const videoSlotRef = useRef(null);

  const isClinical = [ROLES.GP, ROLES.AHP, 'conference_guest'].includes(user?.role);
  const roomInfo = session?.conferenceId === String(id) || String(session?.conferenceId) === String(id)
    ? session?.roomInfo
    : (location.state || null);
  const isJitsi = roomInfo?.provider === 'jitsi';
  const patientName = session?.patientName || roomInfo?.patientName || roomInfo?.conference?.patient_name || '';
  const { videoStatus, videoError, micOn, camOn, remotePeerCount = 0 } = mediaState;

  const bindVideoSlot = useCallback((el) => {
    videoSlotRef.current = el;
    registerVideoSlot(el);
  }, [registerVideoSlot]);

  useEffect(() => {
    api.get(`/conferences/${id}`)
      .then(({ data }) => {
        if (data.data?.gp_id) setIsAssignedGp(user?.role === ROLES.GP);
        if (data.data?.patient_name) {
          updateRoomInfo({
            patientName: data.data.patient_name,
            roomInfo: {
              patientName: data.data.patient_name,
              conference: {
                ...(roomInfo?.conference || {}),
                patient_name: data.data.patient_name,
              },
            },
          });
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.role]);

  useEffect(() => {
    let mounted = true;
    const sameSession = session && String(session.conferenceId) === String(id);

    if (sameSession) {
      attachRoomView();
      setLoading(false);
      return () => {
        if (mounted) detachRoomView();
      };
    }

    const initRoom = async () => {
      try {
        const { data } = await api.post(`/conferences/${id}/join`);
        if (!mounted) return;
        const nextRoom = data.data;
        startSession({
          conferenceId: id,
          roomInfo: nextRoom,
          patientName: nextRoom?.patientName || nextRoom?.conference?.patient_name || location.state?.patientName || '',
          isAssignedGp: user?.role === ROLES.GP,
        });
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
      detachRoomView();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEditRequest = async () => {
    if (!editReason.trim()) return;
    setSubmittingRequest(true);
    try {
      await api.post(`/conferences/${id}/reports/edit-request`, { reason: editReason.trim() });
      toast.success('Edit request sent to receptionist');
      setEditRequestOpen(false);
      setEditReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const videoConnecting = !isJitsi && (loading || videoStatus === 'connecting' || (videoStatus === 'idle' && roomInfo?.iceServers));
  const videoControlsDisabled = isJitsi ? loading : (videoConnecting || videoStatus === 'error');
  const showLive = isJitsi ? jitsiLive : videoStatus === 'connected';
  const participantCount = isJitsi ? jitsiParticipants : (1 + remotePeerCount);
  const participantLabel = `${participantCount} participant${participantCount === 1 ? '' : 's'}`;

  const MeetingActionButton = ({ size = 'medium' }) => (
    <Button
      variant="contained"
      color="error"
      size={size}
      startIcon={<ExitToAppOutlined />}
      onClick={leaveSession}
      disabled={videoControlsDisabled}
    >
      Leave Meeting
    </Button>
  );

  const videoControls = (
    <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ py: 1 }}>
      {!isJitsi && (
        <>
          <IconButton
            onClick={toggleMic}
            disabled={videoControlsDisabled}
            sx={{ bgcolor: micOn ? 'background.paper' : 'error.main', color: micOn ? 'text.primary' : 'error.contrastText' }}
          >
            {micOn ? <MicOutlined /> : <MicOffOutlined />}
          </IconButton>
          <IconButton
            onClick={toggleCam}
            disabled={videoControlsDisabled}
            sx={{ bgcolor: camOn ? 'background.paper' : 'error.main', color: camOn ? 'text.primary' : 'error.contrastText' }}
          >
            {camOn ? <VideocamOutlined /> : <VideocamOffOutlined />}
          </IconButton>
        </>
      )}
    </Stack>
  );

  if (!roomInfo && loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography mt={2} color="text.secondary">Connecting to meeting...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={leaveSession}><ArrowBackOutlined /></IconButton>
        <Typography variant="h6" fontWeight={700}>
          {patientName || 'Clinical Video Conference'}
        </Typography>
        {showLive && (
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {participantLabel}
          </Typography>
        )}
        {showLive && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ ml: 0.5 }}>
            <LiveDot />
            <Typography variant="caption" color="error.main" fontWeight={700}>
              Live
            </Typography>
          </Stack>
        )}
        <Box sx={{ flex: 1 }} />
        <MeetingActionButton />
      </Stack>

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 2, minHeight: 0 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box
            ref={bindVideoSlot}
            sx={{ flex: 1, position: 'relative', minHeight: { xs: 280, md: 0 } }}
          >
            {videoConnecting && isJitsi === false && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 1 }}>
                <CircularProgress color="inherit" sx={{ color: 'grey.400' }} />
                <Typography sx={{ position: 'absolute', top: '58%', color: 'grey.400' }} variant="body2">
                  Starting private video...
                </Typography>
              </Box>
            )}
            {videoError && (
              <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, p: 2 }}>
                <Alert severity="error">{videoError}</Alert>
              </Box>
            )}
          </Box>
          {!isJitsi && videoControls}
        </Paper>

        {isClinical && (
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', minHeight: 0, overflow: 'hidden' }}>
            <ConferenceReportPanel
              conferenceId={id}
              user={user}
              isAssignedGp={isAssignedGp}
              onRequestEdit={() => setEditRequestOpen(true)}
            />
          </Paper>
        )}
      </Box>

      <Dialog open={editRequestOpen} onClose={() => setEditRequestOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Report Edit Access</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRequestOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRequest} disabled={submittingRequest}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConferenceRoom;
