import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Box, Typography, Stack, Chip, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  VisibilityOutlined, PeopleOutlined, VideoCallOutlined, PersonOutlined,
} from '@mui/icons-material';
import api from '../services/api';
import { formatCalendarDate, formatClockTime, formatDateTime } from '../utils/dateTime';
import { dialogPaperSx, PremiumDialogHeader } from './PremiumFormFields';

const formatRole = (role, isGuest) => {
  const label = String(role || 'other').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (isGuest && !label.toLowerCase().includes('guest')) return `Guest ${label}`;
  return label;
};

const ParticipantList = ({ items, emptyLabel, showJoinTimes = false }) => {
  if (!items?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, textAlign: 'center' }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Stack
          key={`${item.user_id}-${item.role}-${item.display_name}`}
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: 'center',
            px: 1.25,
            py: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <PersonOutlined sx={{ fontSize: 17 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {item.display_name || 'Unknown'}
            </Typography>
            {showJoinTimes && item.sessions?.[0]?.joined_at && (
              <Typography variant="caption" color="text.secondary">
                Joined {formatDateTime(item.sessions[0].joined_at)}
                {item.sessions[item.sessions.length - 1]?.left_at
                  ? ` · Left ${formatDateTime(item.sessions[item.sessions.length - 1].left_at)}`
                  : ''}
              </Typography>
            )}
          </Box>
          <Chip
            size="small"
            label={formatRole(item.role, item.is_guest)}
            sx={{ height: 22, fontWeight: 700, textTransform: 'capitalize' }}
          />
        </Stack>
      ))}
    </Stack>
  );
};

const TimeCard = ({ label, value }) => (
  <Box
    sx={{
      flex: 1,
      p: 1.5,
      borderRadius: 2,
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
    }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
      {value ? formatClockTime(value) : '—'}
    </Typography>
  </Box>
);

const ConferenceHistoryViewDialog = ({ open, conferenceId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !conferenceId) return undefined;
    let active = true;
    setLoading(true);
    setData(null);
    api.get(`/conferences/${conferenceId}/participants`)
      .then(({ data: res }) => {
        if (active) setData(res.data || null);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [open, conferenceId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper" PaperProps={{ sx: dialogPaperSx }}>
      <PremiumDialogHeader
        icon={VisibilityOutlined}
        title={data?.conference_code || 'Conference'}
        subtitle={data
          ? `${data.patient_name || 'Patient'} · ${formatCalendarDate(data.scheduled_date)}`
          : 'Assigned and joined participants'}
      />
      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {loading && (
          <Stack sx={{ alignItems: 'center', py: 6 }} spacing={1.5}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Loading meeting details…</Typography>
          </Stack>
        )}

        {!loading && !data && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Unable to load this meeting.
          </Typography>
        )}

        {!loading && data && (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5}>
              <TimeCard label="Start time" value={data.started_time} />
              <TimeCard label="End time" value={data.ended_time} />
            </Stack>

            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                <PeopleOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Assigned participants</Typography>
              </Stack>
              <ParticipantList items={data.assigned} emptyLabel="No participants were assigned." />
            </Box>

            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                <VideoCallOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Joined participants</Typography>
              </Stack>
              <ParticipantList
                items={data.joined}
                emptyLabel="No one joined this meeting."
                showJoinTimes
              />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: '9999px', px: 3, fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConferenceHistoryViewDialog;
