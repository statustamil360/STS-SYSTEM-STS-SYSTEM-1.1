import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Button, Stack, Typography, IconButton, Paper, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import {
  CallEndOutlined, MicOutlined, MicOffOutlined, VideocamOutlined, VideocamOffOutlined,
  ArrowBackOutlined, ExitToAppOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROLES } from '../../utils/constants';
import ConferenceReportPanel from '../../components/ConferenceReportPanel';
import WebRTCVideoRoom from '../../components/WebRTCVideoRoom';
import useMediasoupConference from '../../hooks/useMediasoupConference';

const ConferenceRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const leaveSentRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState(location.state || null);
  const [isAssignedGp, setIsAssignedGp] = useState(user?.role === ROLES.GP);
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const isGp = user?.role === ROLES.GP;
  const isClinical = [ROLES.GP, ROLES.AHP, 'conference_guest'].includes(user?.role);

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
    conferenceId: id,
    iceServers: roomInfo?.iceServers,
    displayName: roomInfo?.displayName || user?.full_name || user?.username,
    enabled: Boolean(roomInfo?.iceServers && roomInfo?.provider === 'webrtc'),
  });

  const recordLeave = async () => {
    if (leaveSentRef.current || !isClinical) return;
    leaveSentRef.current = true;
    try {
      await api.post(`/conferences/${id}/leave`);
    } catch {
      /* best-effort */
    }
  };

  useEffect(() => {
    api.get(`/conferences/${id}`)
      .then(({ data }) => {
        if (data.data?.gp_id) setIsAssignedGp(user?.role === ROLES.GP);
      })
      .catch(() => {});
  }, [id, user?.role]);

  useEffect(() => {
    let mounted = true;

    const initRoom = async () => {
      try {
        let info = roomInfo;
        if (!info?.iceServers || info?.provider !== 'webrtc') {
          const { data } = await api.post(`/conferences/${id}/join`);
          info = data.data;
          if (mounted) setRoomInfo(info);
        }
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
      recordLeave();
      leaveVideo();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEndMeeting = async () => {
    try {
      leaveVideo();
      await recordLeave();
      await api.post(`/conferences/${id}/end`);
      toast.success('Meeting ended — documents are being generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end meeting');
    }
    navigate('/conferences?tab=documents');
  };

  const handleLeave = async () => {
    leaveVideo();
    await recordLeave();
    navigate('/conferences');
  };

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

  const videoConnecting = loading || videoStatus === 'connecting' || (videoStatus === 'idle' && roomInfo?.iceServers);
  const videoControlsDisabled = videoConnecting || videoStatus === 'error';

  const videoControls = (
    <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ py: 1 }}>
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
      {isGp ? (
        <Button variant="contained" color="error" startIcon={<CallEndOutlined />} onClick={handleEndMeeting} disabled={videoControlsDisabled}>
          End Meeting
        </Button>
      ) : (
        <Button variant="outlined" color="inherit" startIcon={<ExitToAppOutlined />} onClick={handleLeave} disabled={videoControlsDisabled}>
          Leave
        </Button>
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
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton onClick={isGp ? undefined : handleLeave} disabled={isGp}><ArrowBackOutlined /></IconButton>
        <Typography variant="h6" fontWeight={700}>Clinical Video Conference</Typography>
        {videoStatus === 'connected' && (
          <Typography variant="caption" color="success.main" fontWeight={700}>
            Live · {1 + remotePeers.length} participant{remotePeers.length === 0 ? '' : 's'}
          </Typography>
        )}
      </Stack>

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 2, minHeight: 0 }}>
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, position: 'relative', minHeight: 280 }}>
            {videoConnecting && (
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
            <WebRTCVideoRoom
              localStream={localStream}
              remotePeers={remotePeers}
              displayName={roomInfo?.displayName}
              userRole={user?.role}
            />
          </Box>
          {videoControls}
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
