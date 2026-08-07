import { useMemo } from 'react';
import {
  Box, Card, Typography, Button, Chip, Stack, CircularProgress, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  AccessTimeOutlined, VideoCallOutlined, CheckCircleOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCountdown, getMeetingDateTime } from '../hooks/useCountdown';
import { ROLES, STATUS_COLORS } from '../utils/constants';
import { formatClockTime } from '../utils/dateTime';
import api from '../services/api';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const MINUTE_MS = 60000;

const URGENCY_TIERS = [
  { id: 'critical', withinMs: 15 * MINUTE_MS, palette: 'error', pulse: true },
  { id: 'soon', withinMs: 60 * MINUTE_MS, palette: 'warning', pulse: false },
  { id: 'approaching', withinMs: 180 * MINUTE_MS, palette: 'success', pulse: false },
  { id: 'ahead', withinMs: Number.POSITIVE_INFINITY, palette: 'info', pulse: false },
];

const CLOSED_TIER = { id: 'closed', palette: null, pulse: false };

const resolveTier = ({ diffMs, isLive, isCompleted }) => {
  if (isCompleted) return CLOSED_TIER;
  if (isLive) return URGENCY_TIERS[0];
  return URGENCY_TIERS.find((tier) => diffMs <= tier.withinMs);
};

const getTone = (theme, tier) => {
  if (!tier.palette) {
    return { base: theme.palette.divider, sheen: theme.palette.divider, accent: theme.palette.text.disabled };
  }
  const color = theme.palette[tier.palette];
  return { base: color.main, sheen: color.light, accent: color.main };
};

const formatMeetingDay = (date) => {
  const parsed = getMeetingDateTime(date, '00:00');
  if (!parsed) return date || '—';
  return parsed.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

const truncate = (value, max = 28) => {
  if (!value) return '—';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const ConferenceMeetingCard = ({
  conference, userRole, onRefresh, accepting, joining, setAccepting, setJoining, isNextUp = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
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

  const tier = useMemo(
    () => resolveTier({ diffMs: countdown.diffMs, isLive, isCompleted }),
    [countdown.diffMs, isLive, isCompleted]
  );
  const tone = useMemo(() => getTone(theme, tier), [theme, tier]);
  const statusColor = STATUS_COLORS[conference.status] || 'default';
  const ahpName = conference.ahp_participants || conference.ahp_name;

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

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        p: '1.5px',
        borderRadius: '14px',
        overflow: 'hidden',
        isolation: 'isolate',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        ...(tier.pulse && { animation: 'confCardPulse 2.2s ease-in-out infinite' }),
        '&:hover': { transform: 'translateY(-2px)' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '240%',
          aspectRatio: '1 / 1',
          zIndex: 0,
          transform: 'translate(-50%, -50%)',
          background: `conic-gradient(from 0deg, ${tone.base} 0deg, ${tone.base} 195deg, ${tone.sheen} 255deg, #FFFFFF 278deg, ${tone.sheen} 305deg, ${tone.base} 352deg, ${tone.base} 360deg)`,
          animation: 'confRingSpin 5s linear infinite',
        },
        '@keyframes confRingSpin': {
          to: { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
        '@keyframes confCardPulse': {
          '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(tone.base, 0.22)}` },
          '50%': { boxShadow: `0 0 0 6px ${alpha(tone.base, 0)}` },
        },
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
          '&::before': { animation: 'none' },
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: 'none',
          borderRadius: '12px',
          bgcolor: 'background.paper',
          backgroundImage: `linear-gradient(160deg, ${alpha(tone.base, 0.06)} 0%, transparent 55%)`,
          boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
        }}
      >
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1.25, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Header */}
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: 'primary.main',
                letterSpacing: '0.02em',
              }}
            >
              {conference.conference_code}
            </Typography>
            <Stack direction="row" spacing={0.4}>
              {isNextUp && !isCompleted && (
                <Chip label="Next" color="primary" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
              )}
              <Chip
                label={formatLabel(conference.status)}
                color={statusColor}
                size="small"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Stack>
          </Stack>

          <Tooltip title={conference.patient_name || ''} placement="top">
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.25,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {conference.patient_name}
            </Typography>
          </Tooltip>

          {/* Countdown + schedule — side by side */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 0.75,
              mb: 1,
              p: 1,
              borderRadius: '10px',
              border: '1px solid',
              borderColor: alpha(tone.base, 0.2),
              bgcolor: alpha(tone.base, 0.05),
            }}
          >
            <Box>
              <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mb: 0.25 }}>
                <AccessTimeOutlined sx={{ fontSize: 12, color: tone.accent }} />
                <Typography
                  variant="caption"
                  sx={{ color: tone.accent, fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {isCompleted ? formatLabel(conference.status) : countdown.prefix}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  color: isCompleted ? 'text.disabled' : tone.accent,
                }}
              >
                {isCompleted ? '—' : countdown.displayTime}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', alignSelf: 'center' }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                {formatMeetingDay(conference.scheduled_date)}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.primary', fontWeight: 700, fontSize: '0.75rem' }}>
                {formatClockTime(conference.scheduled_time)}
              </Typography>
            </Box>
          </Box>

          {/* Participants — compact */}
          <Stack spacing={0.35} sx={{ mb: 1, flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.35 }} noWrap>
              <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>GP:</Box>
              {' '}{truncate(conference.gp_name, 22)}
            </Typography>
            <Tooltip title={ahpName || ''} placement="bottom">
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>AHP:</Box>
                {' '}{truncate(ahpName, 22)}
              </Typography>
            </Tooltip>
          </Stack>

          {/* Action */}
          <Box sx={{ mt: 'auto' }}>
            {isClinical ? (
              <>
                {canAccept && (
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={accepting === conference.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlined sx={{ fontSize: 16 }} />}
                    disabled={accepting === conference.id}
                    onClick={handleAccept}
                    sx={{ py: 0.6, fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Accept & Join
                  </Button>
                )}
                {(canJoinGp && !canAccept) && (
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    startIcon={joining === conference.id ? <CircularProgress size={14} color="inherit" /> : <VideoCallOutlined sx={{ fontSize: 16 }} />}
                    disabled={joining === conference.id}
                    onClick={handleJoin}
                    sx={{ py: 0.6, fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Join
                  </Button>
                )}
                {canJoinAhp && (
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    startIcon={joining === conference.id ? <CircularProgress size={14} color="inherit" /> : <VideoCallOutlined sx={{ fontSize: 16 }} />}
                    disabled={joining === conference.id}
                    onClick={handleJoin}
                    sx={{ py: 0.6, fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Join
                  </Button>
                )}
                {waitingForGp && (
                  <Button fullWidth size="small" variant="outlined" disabled sx={{ py: 0.55, fontSize: '0.68rem', borderRadius: '8px' }}>
                    Awaiting GP
                  </Button>
                )}
                {isCompleted && (
                  <Button fullWidth size="small" variant="outlined" disabled sx={{ py: 0.55, fontSize: '0.68rem', borderRadius: '8px' }}>
                    {conference.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                  </Button>
                )}
              </>
            ) : (
              <Box
                sx={{
                  py: 0.55,
                  px: 1,
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: alpha(tone.base, 0.22),
                  bgcolor: alpha(tone.base, 0.05),
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: tone.accent, fontSize: '0.68rem' }}>
                  {isLive ? 'In progress' : 'Awaiting GP acceptance'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default ConferenceMeetingCard;
