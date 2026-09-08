import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box, Button, Stack, Typography, IconButton, Paper, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip, Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ArrowBackOutlined, ExitToAppOutlined, DescriptionOutlined, AttachFileOutlined,
  FolderOpenOutlined, NotesOutlined, StickyNote2Outlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROLES, canJoinVideoRoom } from '../../utils/constants';
import ConferenceReportPanel from '../../components/ConferenceReportPanel';
import ConferenceRoomContextDrawer from '../../components/ConferenceRoomContextDrawer';
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

const toolBtnSx = {
  width: 38,
  height: 38,
  borderRadius: '10px',
  color: 'text.secondary',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  '&:hover': {
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
    color: 'primary.main',
    borderColor: (theme) => alpha(theme.palette.primary.main, 0.35),
  },
};

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
  } = useConferenceSession();

  const [loading, setLoading] = useState(!session || String(session.conferenceId) !== String(id));
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [clinicalContext, setClinicalContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [panelAnchor, setPanelAnchor] = useState(null);
  const videoSlotRef = useRef(null);
  const reportColRef = useRef(null);

  const isClinical = [ROLES.GP, ROLES.AHP, 'conference_guest'].includes(user?.role);
  const roomInfo = session?.conferenceId === String(id) || String(session?.conferenceId) === String(id)
    ? session?.roomInfo
    : (location.state || null);
  const isJitsi = roomInfo?.provider === 'jitsi';
  const patientName = session?.patientName || roomInfo?.patientName || roomInfo?.conference?.patient_name || '';
  const { videoStatus, videoError, remotePeerCount = 0 } = mediaState;

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
    setContextLoading(true);
    api.get(`/conferences/${id}/clinical-context`)
      .then(({ data }) => {
        if (mounted) setClinicalContext(data.data || null);
      })
      .catch(() => {
        if (mounted) setClinicalContext(null);
      })
      .finally(() => {
        if (mounted) setContextLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  useLayoutEffect(() => {
    const videoEl = videoSlotRef.current;
    const reportEl = reportColRef.current;
    if (!videoEl) return undefined;

    const update = () => {
      const video = videoEl.getBoundingClientRect();
      const report = reportEl?.getBoundingClientRect();
      const stacked = report ? report.top > video.top + 48 : false;
      if (report && report.width > 0) {
        setPanelAnchor({
          top: stacked ? report.top : video.top,
          left: report.left,
          width: report.width,
          height: stacked
            ? Math.max(220, Math.min(video.height, report.height || video.height))
            : video.height,
        });
        return;
      }
      const width = Math.min(420, Math.max(280, window.innerWidth * 0.34));
      setPanelAnchor({
        top: video.top,
        left: Math.max(16, video.right - width),
        width,
        height: video.height,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(videoEl);
    if (reportEl) observer.observe(reportEl);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [loading, isClinical, roomInfo, activePanel]);

  useEffect(() => {
    let mounted = true;

    if (!user?.role) return undefined;
    if (!canJoinVideoRoom(user.role)) {
      toast.info('Reception opens and ends meetings. Participants join the video room.');
      if (session && String(session.conferenceId) === String(id)) {
        leaveSession();
      } else {
        navigate('/conferences?tab=upcoming', { replace: true });
      }
      return undefined;
    }

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

  const closePanel = useCallback(() => setActivePanel(null), []);

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

  const fileCount = clinicalContext?.files?.length || 0;
  const hasPatientRecords = Boolean(String(clinicalContext?.patient_previous_records || '').trim()
    || String(clinicalContext?.medical_history || '').trim());
  const hasInternal = Boolean(String(clinicalContext?.internal_notes || '').trim());
  const hasConferenceNote = Boolean(String(clinicalContext?.conference_note || clinicalContext?.conference_notes || '').trim());

  const hasPreviousText = Boolean(String(clinicalContext?.patient_previous_records || '').trim());

  const tools = [
    {
      id: 'patientRecords',
      label: 'Patient Previous Records',
      icon: DescriptionOutlined,
      badge: hasPatientRecords ? 1 : 0,
      color: '#0D9488',
      bg: '#CCFBF1',
    },
    {
      id: 'files',
      label: 'Attach Files',
      icon: AttachFileOutlined,
      badge: fileCount,
      color: '#EA580C',
      bg: '#FFEDD5',
    },
    {
      id: 'previous',
      label: 'Previous Records',
      icon: FolderOpenOutlined,
      badge: hasPreviousText ? 1 : 0,
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    {
      id: 'internal',
      label: 'Internal Notes',
      icon: NotesOutlined,
      badge: hasInternal ? 1 : 0,
      color: '#7C3AED',
      bg: '#EDE9FE',
    },
    {
      id: 'conferenceNote',
      label: 'Conference Note',
      icon: StickyNote2Outlined,
      badge: hasConferenceNote ? 1 : 0,
      color: '#059669',
      bg: '#D1FAE5',
    },
  ];

  if (user?.role && !canJoinVideoRoom(user.role)) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!roomInfo && loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography mt={2} color="text.secondary">Connecting to meeting...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: { xs: 'auto', md: 'calc(100vh - 104px)' },
      minHeight: { xs: 'calc(100vh - 104px)', md: 0 },
      display: 'flex',
    }}
    >
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.06)',
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: 1,
              px: { xs: 1.25, sm: 2 },
              pt: 1.25,
              pb: 1,
            }}
          >
            <Stack direction="row" alignItems="center" sx={{ justifySelf: 'start' }}>
              <Tooltip title="Leave meeting">
                <IconButton onClick={leaveSession} sx={{ ...toolBtnSx, width: 36, height: 36 }}>
                  <ArrowBackOutlined sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 0, px: 1 }}>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                noWrap
                sx={{ letterSpacing: '-0.01em', maxWidth: { xs: 220, sm: 420, md: 560 }, textAlign: 'center' }}
              >
                {patientName || 'Clinical Video Conference'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                {showLive && <LiveDot />}
                <Typography variant="caption" sx={{ color: showLive ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
                  {showLive ? `Live · ${participantLabel}` : participantLabel}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ justifySelf: 'end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Tooltip key={tool.id} title={tool.label}>
                    <IconButton
                      data-room-tool
                      aria-label={tool.label}
                      onClick={() => setActivePanel((prev) => (prev === tool.id ? null : tool.id))}
                      sx={{
                        ...toolBtnSx,
                        bgcolor: tool.bg,
                        color: tool.color,
                        borderColor: `${tool.color}33`,
                        ...(activePanel === tool.id ? {
                          bgcolor: tool.bg,
                          color: tool.color,
                          borderColor: tool.color,
                          boxShadow: `0 0 0 3px ${tool.color}22`,
                        } : {}),
                        '&:hover': {
                          bgcolor: tool.bg,
                          color: tool.color,
                          borderColor: tool.color,
                        },
                      }}
                    >
                      <Badge
                        color="primary"
                        variant={tool.badge > 1 ? 'standard' : 'dot'}
                        badgeContent={tool.badge}
                        invisible={!tool.badge}
                        overlap="circular"
                      >
                        <Icon sx={{ fontSize: 20 }} />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                );
              })}
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<ExitToAppOutlined />}
                onClick={leaveSession}
                disabled={videoControlsDisabled}
                sx={{
                  ml: 0.25,
                  height: 38,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.5,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Leave
              </Button>
            </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: isClinical ? 'minmax(0, 1.15fr) minmax(0, 1fr)' : '1fr' },
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              p: { xs: 1.5, md: 2 },
              bgcolor: '#0b1220',
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                containerType: 'size',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                ref={bindVideoSlot}
                sx={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  width: '100%',
                  maxWidth: 'calc(100cqh * 16 / 9)',
                  maxHeight: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: '#020617',
                  border: '1px solid',
                  borderColor: 'rgba(45, 212, 191, 0.35)',
                  minHeight: { xs: 200, md: 0 },
                }}
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
            </Box>
          </Box>

          {isClinical && (
            <Box
              ref={reportColRef}
              sx={{
                minHeight: 0,
                overflow: 'hidden',
                borderLeft: { lg: '1px solid' },
                borderTop: { xs: '1px solid', lg: 'none' },
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: { xs: 520, lg: 'auto' },
              }}
            >
              <ConferenceReportPanel
                conferenceId={id}
                user={user}
                isAssignedGp={isAssignedGp}
                onRequestEdit={() => setEditRequestOpen(true)}
              />
            </Box>
          )}
        </Box>
      </Paper>

      <ConferenceRoomContextDrawer
        open={Boolean(activePanel)}
        panel={activePanel}
        onClose={closePanel}
        conferenceId={id}
        context={clinicalContext}
        loading={contextLoading}
        anchor={panelAnchor}
      />

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
