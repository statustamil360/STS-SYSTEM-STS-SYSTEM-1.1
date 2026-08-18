import { useEffect, useState, Fragment } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Stack, Collapse, IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeOutlined, ExpandMoreOutlined, ExpandLessOutlined,
} from '@mui/icons-material';
import api from '../services/api';
import { formatDateTime, formatDuration, formatClockTime, formatCalendarDate } from '../utils/dateTime';

const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Other';

const ConferenceAttendanceDialog = ({ open, conferenceId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    if (!open || !conferenceId) return undefined;

    const load = async () => {
      setLoading(true);
      setData(null);
      setExpandedUser(null);
      try {
        const { data: res } = await api.get(`/conferences/${conferenceId}/attendance`);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
    return undefined;
  }, [open, conferenceId]);

  const handleClose = () => {
    setData(null);
    setExpandedUser(null);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeOutlined color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>Participant Join Times</Typography>
            {data && (
              <Typography variant="caption" color="text.secondary">
                {data.conference_code}
                {' · '}
                {data.patient_name}
                {' · '}
                {formatCalendarDate(data.scheduled_date)}
                {' '}
                {formatClockTime(data.scheduled_time)}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        )}

        {!loading && !data?.participants?.length && (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No join time records for this conference yet.
          </Typography>
        )}

        {!loading && data?.participants?.length > 0 && (
          <>
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total recorded join time (all participants)
              </Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                {formatDuration(data.meeting_total_seconds)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Used for salary calculation — includes every join/rejoin session until leave or meeting end.
              </Typography>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Participant</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Sessions</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Total Time</TableCell>
                    <TableCell width={48} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.participants.map((p) => (
                    <Fragment key={p.user_id}>
                      <TableRow hover>
                        <TableCell sx={{ fontWeight: 600 }}>{p.display_name}</TableCell>
                        <TableCell>
                          <Chip label={formatRole(p.role)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="center">{p.sessions.length}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatDuration(p.total_seconds)}
                        </TableCell>
                        <TableCell align="center">
                          {p.sessions.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => setExpandedUser(expandedUser === p.user_id ? null : p.user_id)}
                            >
                              {expandedUser === p.user_id
                                ? <ExpandLessOutlined fontSize="small" />
                                : <ExpandMoreOutlined fontSize="small" />}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      {p.sessions.length > 1 && (
                        <TableRow key={`${p.user_id}-detail`}>
                          <TableCell colSpan={5} sx={{ py: 0, borderBottom: expandedUser === p.user_id ? undefined : 0 }}>
                            <Collapse in={expandedUser === p.user_id}>
                              <Box sx={{ py: 1.5, pl: 2 }}>
                                {p.sessions.map((s, idx) => (
                                  <Typography key={s.id} variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {`Session ${idx + 1}: ${formatDateTime(s.joined_at)} → ${s.left_at ? formatDateTime(s.left_at) : 'In progress'} (${formatDuration(s.duration_seconds)})`}
                                  </Typography>
                                ))}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                      {p.sessions.length === 1 && (
                        <TableRow key={`${p.user_id}-single`}>
                          <TableCell colSpan={5} sx={{ py: 0.5, borderTop: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                              {`${formatDateTime(p.sessions[0].joined_at)} → ${p.sessions[0].left_at ? formatDateTime(p.sessions[0].left_at) : 'In progress'}`}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConferenceAttendanceDialog;
