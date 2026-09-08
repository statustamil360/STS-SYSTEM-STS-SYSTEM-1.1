import { useCallback, useState } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Stack, Chip, Button, Dialog,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloseOutlined, VideoCallOutlined, AccessTimeOutlined, PersonOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api from '../services/api';
import { ROLES, isMeetingHostRole } from '../utils/constants';
import useSystemDateTime from '../hooks/useSystemDateTime';
import useReceptionistPermissions from '../hooks/useReceptionistPermissions';
import useStaffSocket from '../hooks/useStaffSocket';
import { useOptionalConferenceSession } from '../context/ConferenceSessionContext';

const meetingId = (payload) => Number(payload?.conference_id || payload?.id || payload?.conferenceId);

const EmptyMeetingPopup = () => {
  const { user } = useSelector((state) => state.auth);
  const sessionCtx = useOptionalConferenceSession();
  const { formatTime, formatStoredClock } = useSystemDateTime();
  const { can } = useReceptionistPermissions();
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(null);

  const isHost = isMeetingHostRole(user?.role)
    && (user?.role !== ROLES.RECEPTIONIST || can('conferences_page'));
  const canEnd = can('conference_end');

  const dismiss = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => meetingId(item) !== Number(id)));
  }, []);

  useStaffSocket(isHost ? user : null, {
    onEmpty: (payload) => {
      if (!payload || !meetingId(payload)) return;
      setQueue((prev) => {
        const id = meetingId(payload);
        if (prev.some((item) => meetingId(item) === id)) {
          return prev.map((item) => (meetingId(item) === id ? { ...item, ...payload } : item));
        }
        return [...prev, payload];
      });
    },
    onOccupied: (payload) => dismiss(meetingId(payload)),
    onContinued: (payload) => dismiss(meetingId(payload)),
    onEnded: (payload) => dismiss(meetingId(payload)),
  });

  const current = queue[0] || null;

  const handleEnd = async () => {
    if (!current) return;
    const id = meetingId(current);
    setBusy('end');
    try {
      const isActiveSession = sessionCtx?.session
        && String(sessionCtx.session.conferenceId) === String(id);
      if (isActiveSession) {
        await sessionCtx.endSession({ force: true });
      } else {
        await api.post(`/conferences/${id}/end`);
        toast.success('Meeting ended — documents are being generated');
      }
      dismiss(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end meeting');
    } finally {
      setBusy(null);
    }
  };

  const handleContinue = async () => {
    if (!current) return;
    const id = meetingId(current);
    setBusy('continue');
    try {
      await api.post(`/conferences/${id}/continue-empty`);
      toast.info('Meeting kept open. You will be asked again if it stays empty.');
      dismiss(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to continue meeting');
    } finally {
      setBusy(null);
    }
  };

  if (!isHost || !canEnd || !current) return null;

  return (
    <Dialog
      open
      onClose={() => { if (!busy) handleContinue(); }}
      PaperProps={{
        sx: {
          m: 0,
          maxWidth: 320,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 16px 48px rgba(15, 23, 42, 0.18)',
        },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Meeting empty</Typography>
          <Typography variant="caption" color="text.secondary">
            No participants for 1 minute
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleContinue} disabled={Boolean(busy)}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <VideoCallOutlined color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }} noWrap>
                {current.patient_name}
              </Typography>
              <Chip
                label={current.status}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.65rem' }}
              />
            </Stack>

            <Box
              sx={{
                mb: 1,
                p: 1.25,
                borderRadius: 2,
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              }}
            >
              <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mb: 0.35 }}>
                <AccessTimeOutlined sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  No participants
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'primary.main',
                }}
              >
                End or continue
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                {current.last_left_at
                  ? `Last left ${formatTime(current.last_left_at)}`
                  : current.last_left_time
                    ? `Last left ${formatStoredClock(current.last_left_time, current.scheduled_date)}`
                    : 'No one has joined yet'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 1.5 }}>
              <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {current.conference_code}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="error"
                fullWidth
                disabled={Boolean(busy)}
                onClick={handleEnd}
                sx={{ borderRadius: 2 }}
              >
                {busy === 'end' ? 'Ending…' : 'End meeting'}
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                fullWidth
                disabled={Boolean(busy)}
                onClick={handleContinue}
                sx={{ borderRadius: 2 }}
              >
                {busy === 'continue' ? 'Keeping open…' : 'Continue'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {queue.length > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            {queue.length} empty meetings waiting
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default EmptyMeetingPopup;
