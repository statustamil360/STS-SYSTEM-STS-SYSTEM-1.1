import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Grid, MenuItem, Link,
  Box, Typography, Stack,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { VideoCallOutlined } from '@mui/icons-material';
import DataTable from '../../components/DataTable';
import ConferenceMeetingCard from '../../components/ConferenceMeetingCard';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import { getFieldPlaceholder, getSelectSlotProps, selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { SelectPlaceholderMenuItem, handleFormDialogClose } from '../../components/PremiumFormFields';
import { ROLES, CONFERENCE_STATUS } from '../../utils/constants';
import { sortMeetingsByCountdown } from '../../hooks/useCountdown';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const meetingsSignature = (list) => (list || [])
  .map((m) => `${m.id}:${m.status}:${m.scheduled_time}`)
  .join('|');

const Conferences = () => {
  const { user } = useSelector((state) => state.auth);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const canUpdateStatus = isClinical;
  const [rows, setRows] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
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
  const [sortTick, setSortTick] = useState(() => Date.now());
  const { register, handleSubmit, reset, control } = useForm();

  const sortedTodayMeetings = useMemo(
    () => sortMeetingsByCountdown(todayMeetings, sortTick),
    [todayMeetings, sortTick]
  );

  const fetchToday = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingToday(true);
    try {
      const { data } = await api.get('/conferences/today', {
        ...(silent ? {} : {
          params: { _ts: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        }),
      });
      const next = data.data ?? [];
      setTodayMeetings((prev) => (
        silent && meetingsSignature(prev) === meetingsSignature(next) ? prev : next
      ));
    } catch {
      if (!silent) toast.error('Failed to load today\'s meetings');
    } finally {
      if (!silent) setLoadingToday(false);
    }
  }, []);

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
    fetchData();
  }, [fetchToday, fetchData]);

  useEffect(() => {
    fetchData();
    fetchToday();
  }, [fetchData, fetchToday]);

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

  const columns = [
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    { field: 'gp_name', headerName: 'GP', render: (r) => r.gp_name || '—' },
    {
      field: 'ahp_name',
      headerName: 'AHP',
      render: (r) => r.ahp_participants || r.ahp_name || '—',
    },
    { field: 'scheduled_date', headerName: 'Date' },
    { field: 'scheduled_time', headerName: 'Time', render: (r) => r.scheduled_time?.slice(0, 5) || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
    {
      field: 'meeting_link',
      headerName: 'Link',
      sortable: false,
      render: (r) => (r.status === 'live' ? 'In progress' : '—'),
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
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <VideoCallOutlined color="primary" />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isClinical ? 'Today\'s Meetings' : 'Today\'s Conference Schedule'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sorted by nearest meeting first — order updates live
            </Typography>
          </Box>
        </Stack>

        {loadingToday ? (
          <Typography color="text.secondary">Loading today&apos;s meetings...</Typography>
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
            <Typography color="text.secondary">No meetings scheduled for today.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
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
