import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Grid, MenuItem,
  Box, Typography, Stack, ToggleButton, ToggleButtonGroup, Button,
  IconButton, Tooltip, Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {
  VideoCallOutlined, HistoryOutlined, OpenInNewOutlined, LinkOutlined, ContentCopyOutlined,
} from '@mui/icons-material';
import DataTable from '../../components/DataTable';
import ConferenceMeetingCard from '../../components/ConferenceMeetingCard';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import { selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { handleFormDialogClose } from '../../components/PremiumFormFields';
import { ROLES, CONFERENCE_STATUS } from '../../utils/constants';
import { sortMeetingsByCountdown } from '../../hooks/useCountdown';
import { formatCalendarDate, formatClockTime } from '../../utils/dateTime';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const meetingsSignature = (list) => (list || [])
  .map((m) => `${m.id}:${m.status}:${m.scheduled_date}:${m.scheduled_time}`)
  .join('|');

const SCHEDULE_RANGES = [
  { value: 'today', label: 'Today', possessive: 'Today\'s', empty: 'today' },
  { value: 'tomorrow', label: 'Tomorrow', possessive: 'Tomorrow\'s', empty: 'tomorrow' },
  { value: 'week', label: 'This Week', possessive: 'This Week\'s', empty: 'this week' },
  { value: 'month', label: 'This Month', possessive: 'This Month\'s', empty: 'this month' },
];

const Conferences = () => {
  const { user } = useSelector((state) => state.auth);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const canUpdateStatus = isClinical;
  const [rows, setRows] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [scheduleRange, setScheduleRange] = useState('today');
  const [loadingToday, setLoadingToday] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [joining, setJoining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [linkPopup, setLinkPopup] = useState({ open: false, url: '', code: '' });
  const [sortTick, setSortTick] = useState(() => Date.now());
  const { register, handleSubmit, reset, control } = useForm();

  const sortedTodayMeetings = useMemo(
    () => sortMeetingsByCountdown(todayMeetings, sortTick),
    [todayMeetings, sortTick]
  );

  const activeRange = useMemo(
    () => SCHEDULE_RANGES.find((r) => r.value === scheduleRange) ?? SCHEDULE_RANGES[0],
    [scheduleRange]
  );

  const handleRangeChange = (_event, value) => {
    if (value) setScheduleRange(value);
  };

  const fetchToday = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingToday(true);
    try {
      const { data } = await api.get('/conferences/schedule', {
        params: {
          range: scheduleRange,
          ...(silent ? {} : { _ts: Date.now() }),
        },
        ...(silent ? {} : {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        }),
      });
      const next = data.data ?? [];
      setTodayMeetings((prev) => (
        silent && meetingsSignature(prev) === meetingsSignature(next) ? prev : next
      ));
    } catch {
      if (!silent) toast.error('Failed to load scheduled meetings');
    } finally {
      if (!silent) setLoadingToday(false);
    }
  }, [scheduleRange]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/conferences', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRows(data.data ?? []);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load conferences'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page, rowsPerPage]);

  const refreshAll = useCallback(() => {
    fetchToday({ silent: true });
    if (showHistory) fetchData();
  }, [fetchToday, fetchData, showHistory]);

  useEffect(() => {
    if (showHistory) fetchData();
  }, [fetchData, showHistory]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useEffect(() => {
    const poll = setInterval(() => fetchToday({ silent: true }), 30000);
    return () => clearInterval(poll);
  }, [fetchToday]);

  useEffect(() => {
    const timer = setInterval(() => setSortTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpen = (row) => {
    setEditRow(row);
    reset({ status: row.status });
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
    reset({ status: 'scheduled' });
  };

  const onSubmit = async (formData) => {
    if (!editRow) return;
    setSubmitting(true);
    try {
      await api.put(`/conferences/${editRow.id}`, formData);
      toast.success('Conference updated successfully');
      handleCloseForm();
      refreshAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleOpenLink = (row) => {
    if (!row.meeting_link) return;
    setLinkPopup({ open: true, url: row.meeting_link, code: row.conference_code || '' });
  };

  const handleCopyLink = async () => {
    if (!linkPopup.url) return;
    try {
      await navigator.clipboard.writeText(linkPopup.url);
      toast.success('Meeting link copied');
    } catch {
      toast.error('Unable to copy link');
    }
  };

  const columns = [
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    { field: 'gp_name', headerName: 'GP', render: (r) => r.gp_name || '—' },
    {
      field: 'ahp_name',
      headerName: 'AHP',
      render: (r) => r.ahp_participants || r.ahp_name || '—',
    },
    { field: 'scheduled_date', headerName: 'Date', render: (r) => formatCalendarDate(r.scheduled_date) },
    { field: 'scheduled_time', headerName: 'Time', render: (r) => formatClockTime(r.scheduled_time) },
    { field: 'status', headerName: 'Status', type: 'status' },
    {
      field: 'meeting_link',
      headerName: 'Link',
      sortable: false,
      render: (r) => (
        r.meeting_link ? (
          <Tooltip title="View meeting link">
            <IconButton
              size="small"
              onClick={() => handleOpenLink(r)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
              }}
            >
              <OpenInNewOutlined sx={{ fontSize: 17 }} color="primary" />
            </IconButton>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">—</Typography>
        )
      ),
    },
  ];

  const conferenceFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Statuses' },
        ...CONFERENCE_STATUS.map((s) => ({ value: s, label: formatLabel(s) })),
      ],
    },
  ];

  return (
    <>
      <Box mb={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <VideoCallOutlined color="primary" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {isClinical
                  ? `${activeRange.possessive} Meetings`
                  : `${activeRange.possessive} Conference Schedule`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sorted by nearest meeting first — order updates live
              </Typography>
            </Box>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={scheduleRange}
            onChange={handleRangeChange}
            aria-label="Conference schedule range"
            sx={{
              flexWrap: 'nowrap',
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderColor: 'divider',
              },
            }}
          >
            {SCHEDULE_RANGES.map((range) => (
              <ToggleButton key={range.value} value={range.value}>
                {range.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        {loadingToday ? (
          <Typography color="text.secondary">Loading scheduled meetings...</Typography>
        ) : todayMeetings.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography color="text.secondary">
              No meetings scheduled for {activeRange.empty}.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
                xl: 'repeat(5, 1fr)',
              },
              gap: { xs: 1.5, xl: 1.25 },
            }}
          >
            {sortedTodayMeetings.map((meeting, index) => (
              <ConferenceMeetingCard
                key={meeting.id}
                conference={meeting}
                userRole={user?.role}
                onRefresh={refreshAll}
                accepting={accepting}
                joining={joining}
                setAccepting={setAccepting}
                setJoining={setJoining}
                isNextUp={index === 0}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: showHistory ? 2 : 0 }}>
        <Button
          variant={showHistory ? 'contained' : 'outlined'}
          startIcon={<HistoryOutlined />}
          onClick={() => setShowHistory((prev) => !prev)}
        >
          Conference History
        </Button>
      </Box>

      {showHistory && (
        <DataTable
          title={isClinical ? 'All My Conferences' : 'Conference History'}
          columns={columns}
          rows={rows}
          loading={loading}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Search by conference ID, patient, GP, or AHP..."
          filters={conferenceFilters}
          onEdit={canUpdateStatus ? handleOpen : undefined}
          actions={canUpdateStatus}
        />
      )}

      <Dialog
        open={linkPopup.open}
        onClose={() => setLinkPopup({ open: false, url: '', code: '' })}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            color: 'common.white',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.primary.light} 100%)`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#FFFFFF', 0.15),
              }}
            >
              <LinkOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.08em' }}>
                MEETING LINK
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {linkPopup.code || 'Conference'}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ px: 3, py: 3, bgcolor: 'background.default' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                wordBreak: 'break-all',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: 'text.primary',
              }}
            >
              {linkPopup.url}
            </Typography>
          </Paper>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ContentCopyOutlined />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<OpenInNewOutlined />}
              href={linkPopup.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Link
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onClose={handleFormDialogClose(handleCloseForm, submitting)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Conference Status</DialogTitle>
        <form key={editRow?.id ?? 'new'} onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              {editRow && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        slotProps={{ select: { MenuProps: selectMenuSlotProps } }}
                      >
                        {CONFERENCE_STATUS.map((s) => <MenuItem key={s} value={s}>{formatLabel(s)}</MenuItem>)}
                      </TextField>
                    )}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel="Update Status"
            loading={submitting}
          />
        </form>
      </Dialog>
    </>
  );
};

export default Conferences;
