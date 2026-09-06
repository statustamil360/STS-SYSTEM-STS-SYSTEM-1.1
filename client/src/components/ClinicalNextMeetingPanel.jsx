import { useState } from 'react';
import { Box, Typography, Stack, Button, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AccessTimeOutlined, VideoCallOutlined, CheckCircleOutlined, CallEndOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCountdown from '../hooks/useCountdown';
import useConferenceOpenLeadMinutes from '../hooks/useConferenceOpenLeadMinutes';
import useReceptionistPermissions from '../hooks/useReceptionistPermissions';
import { formatClockTime } from '../utils/dateTime';
import { ROLES } from '../utils/constants';
import api from '../services/api';

const ClinicalNextMeetingPanel = ({ meeting, userRole, onRefresh }) => {
  const navigate = useNavigate();
  const countdown = useCountdown(meeting?.scheduled_date, meeting?.scheduled_time);
  const openLeadMinutes = useConferenceOpenLeadMinutes();
  const { can } = useReceptionistPermissions();
  const [accepting, setAccepting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [ending, setEnding] = useState(false);

  if (!meeting) {
    return (
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 2.5,
          bgcolor: alpha('#FFFFFF', 0.1),
          border: '1px solid',
          borderColor: alpha('#FFFFFF', 0.18),
          minWidth: { md: 280 },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9 }}>
          No meetings scheduled for today
        </Typography>
      </Box>
    );
  }

  const isGp = userRole === ROLES.GP;
  const isAhp = userRole === ROLES.AHP;
  const isGuest = userRole === ROLES.CONFERENCE_GUEST;
  // Admins supervise reception, so they get the same open/end control.
  const isMeetingHost = [ROLES.RECEPTIONIST, ROLES.ADMIN].includes(userRole);
  const isParticipant = isGp || isAhp || isGuest;
  const isAccepted = ['waiting', 'live'].includes(meeting.status);
  const isCompleted = ['completed', 'cancelled'].includes(meeting.status);
  const withinAcceptWindow = countdown.diffMs <= openLeadMinutes * 60 * 1000;
  const isPendingOpen = isMeetingHost && meeting.status === 'scheduled' && !isCompleted && can('conference_open');
  const canAccept = isPendingOpen && withinAcceptWindow;
  const acceptTooEarly = isPendingOpen && !withinAcceptWindow;
  const canEnd = isMeetingHost && isAccepted && !isCompleted && can('conference_end');
  const canJoin = isParticipant && isAccepted && !isCompleted;
  const waitingForReception = isParticipant && meeting.status === 'scheduled';

  const goToRoom = (data) => {
    navigate(`/conferences/${meeting.id}/room`, {
      state: {
        provider: data.provider,
        roomId: data.roomId,
        iceServers: data.iceServers,
        displayName: data.displayName,
        patientName: data.patientName || meeting.patient_name || '',
      },
    });
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.post(`/conferences/${meeting.id}/accept`);
      toast.success('Meeting opened — participants can now join');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open meeting');
    } finally {
      setAccepting(false);
    }
  };

  const endMeeting = async (force = false) => {
    setEnding(true);
    try {
      await api.post(`/conferences/${meeting.id}/end`, force ? { force: true } : {});
      toast.success('Meeting ended — documents are being generated');
      onRefresh?.();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'PARTICIPANTS_STILL_IN') {
        const confirmed = window.confirm(err.response.data.message);
        if (confirmed) {
          await endMeeting(true);
          return;
        }
      } else {
        toast.error(err.response?.data?.message || 'Failed to end meeting');
      }
    } finally {
      setEnding(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { data } = await api.post(`/conferences/${meeting.id}/join`);
      toast.success('Joining meeting...');
      goToRoom(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot join meeting yet');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2.5,
        bgcolor: alpha('#FFFFFF', 0.12),
        border: '1px solid',
        borderColor: alpha('#FFFFFF', 0.22),
        minWidth: { md: 300 },
        maxWidth: 360,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.08em', opacity: 0.85, display: 'block', mb: 1 }}>
        NEXT MEETING TODAY
      </Typography>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700, flex: 1 }}>
          {meeting.patient_name}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {formatClockTime(meeting.scheduled_time)}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
          <AccessTimeOutlined sx={{ fontSize: 16, opacity: 0.9 }} />
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.06em', opacity: 0.85 }}>
              {countdown.prefix}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {countdown.displayTime}
            </Typography>
          </Box>
        </Stack>

        {canAccept && (
          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={accepting}
            startIcon={accepting ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlined sx={{ fontSize: 16 }} />}
            onClick={handleAccept}
            sx={{ flexShrink: 0, fontWeight: 700, borderRadius: 2, bgcolor: 'common.white', color: 'success.dark', '&:hover': { bgcolor: alpha('#FFFFFF', 0.9) } }}
          >
            Open
          </Button>
        )}
        {acceptTooEarly && (
          <Button
            size="small"
            variant="outlined"
            disabled
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              px: 1.25,
              color: 'common.white',
              borderColor: alpha('#FFFFFF', 0.45),
              opacity: 0.9,
            }}
          >
            {openLeadMinutes > 0 ? `Opens ${openLeadMinutes} min before` : 'At assigned time'}
          </Button>
        )}
        {canEnd && (
          <Button
            size="small"
            variant="contained"
            color="error"
            disabled={ending}
            startIcon={ending ? <CircularProgress size={14} color="inherit" /> : <CallEndOutlined sx={{ fontSize: 16 }} />}
            onClick={() => endMeeting(false)}
            sx={{ flexShrink: 0, fontWeight: 700, borderRadius: 2 }}
          >
            End
          </Button>
        )}
        {canJoin && (
          <Button
            size="small"
            variant="contained"
            disabled={joining}
            startIcon={joining ? <CircularProgress size={14} color="inherit" /> : <VideoCallOutlined sx={{ fontSize: 16 }} />}
            onClick={handleJoin}
            sx={{ flexShrink: 0, fontWeight: 700, borderRadius: 2, bgcolor: 'common.white', color: 'primary.main', '&:hover': { bgcolor: alpha('#FFFFFF', 0.9) } }}
          >
            Join
          </Button>
        )}
        {waitingForReception && (
          <Button
            size="small"
            variant="outlined"
            disabled
            sx={{
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.75rem',
              borderRadius: 2,
              py: 0.5,
              px: 1.25,
              color: 'common.white',
              borderColor: alpha('#FFFFFF', 0.45),
              opacity: 0.9,
            }}
          >
            Awaiting reception
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default ClinicalNextMeetingPanel;
