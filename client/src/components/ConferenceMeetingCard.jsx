import {
  Box, Card, CardContent, Typography, Button, Chip, Stack, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeOutlined, PersonOutlined, VideoCallOutlined, CheckCircleOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCountdown } from '../hooks/useCountdown';
import { ROLES, STATUS_COLORS } from '../utils/constants';
import api from '../services/api';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const ConferenceMeetingCard = ({ conference, userRole, onRefresh, accepting, joining, setAccepting, setJoining, isNextUp = false }) => {
  const navigate = useNavigate();
  const countdown = useCountdown(conference.scheduled_date, conference.scheduled_time);
  const isGp = userRole === ROLES.GP;
  const isAhp = userRole === ROLES.AHP;
  const isClinical = isGp || isAhp;
  const isLive = conference.status === 'live';
  const isCompleted = ['completed', 'cancelled'].includes(conference.status);
  const canAccept = isGp && !isLive && !isCompleted;
  const canJoinGp = isGp && (isLive || countdown.started) && !isCompleted;
  const canJoinAhp = isAhp && isLive && !isCompleted;
  const waitingForGp = isAhp && !isLive && !isCompleted;

  const goToRoom = (data) => {
    navigate(`/conferences/${conference.id}/room`, {
      state: {
        provider: data.provider,
        roomUrl: data.roomUrl,
        roomId: data.roomId,
        token: data.token,
      },
    });
  };

  const handleAccept = async () => {
    setAccepting(conference.id);
    try {
      const { data } = await api.post(`/conferences/${conference.id}/accept`);
      toast.success('Meeting accepted — joining now');
      onRefresh?.();
      goToRoom(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept meeting');
    } finally {
      setAccepting(null);
    }
  };

  const handleJoin = async () => {
    setJoining(conference.id);
    try {
      const { data } = await api.post(`/conferences/${conference.id}/join`);
      toast.success('Joining meeting...');
      onRefresh?.();
      goToRoom(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot join meeting yet');
    } finally {
      setJoining(null);
    }
  };

  const statusColor = STATUS_COLORS[conference.status] || 'default';

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: isLive ? 'success.main' : 'divider',
        bgcolor: (theme) => (isLive ? alpha(theme.palette.success.main, 0.04) : 'background.paper'),
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              {conference.conference_code}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {conference.patient_name}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
            {isNextUp && !isCompleted && (
              <Chip label="Next up" color="primary" size="small" sx={{ fontWeight: 700 }} />
            )}
            <Chip
              label={formatLabel(conference.status)}
              color={statusColor}
              size="small"
              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
            />
          </Stack>
        </Stack>

        <Box
          sx={{
            textAlign: 'center',
            py: 2,
            px: 1,
            mb: 2,
            borderRadius: 2.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <AccessTimeOutlined sx={{ color: 'primary.main', mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary" display="block">
            {countdown.prefix}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            color={countdown.started ? 'warning.main' : 'primary.main'}
            sx={{ fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}
          >
            {countdown.displayTime}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {conference.scheduled_date} · {conference.scheduled_time?.slice(0, 5)}
          </Typography>
        </Box>

        <Stack spacing={1} mb={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">
              <strong>GP:</strong> {conference.gp_name || '—'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">
              <strong>AHP:</strong> {conference.ahp_participants || conference.ahp_name || '—'}
            </Typography>
          </Stack>
        </Stack>

        {isClinical ? (
          <Stack direction="row" spacing={1}>
            {canAccept && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={accepting === conference.id ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlined />}
                disabled={accepting === conference.id}
                onClick={handleAccept}
              >
                Accept & Join
              </Button>
            )}
            {canJoinGp && !canAccept && (
              <Button
                fullWidth
                variant="contained"
                startIcon={joining === conference.id ? <CircularProgress size={18} color="inherit" /> : <VideoCallOutlined />}
                disabled={joining === conference.id}
                onClick={handleJoin}
              >
                Join Meeting
              </Button>
            )}
            {canJoinAhp && (
              <Button
                fullWidth
                variant="contained"
                startIcon={joining === conference.id ? <CircularProgress size={18} color="inherit" /> : <VideoCallOutlined />}
                disabled={joining === conference.id}
                onClick={handleJoin}
              >
                Join Meeting
              </Button>
            )}
            {waitingForGp && (
              <Button fullWidth variant="outlined" disabled>
                Waiting for GP to accept
              </Button>
            )}
            {isCompleted && (
              <Button fullWidth variant="outlined" disabled>
                {conference.status === 'cancelled' ? 'Cancelled' : 'Meeting ended'}
              </Button>
            )}
          </Stack>
        ) : (
          <Chip
            label={isLive ? 'Meeting in progress' : 'Scheduled — awaiting GP acceptance'}
            color={isLive ? 'success' : 'default'}
            variant="outlined"
            sx={{ width: '100%' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ConferenceMeetingCard;
