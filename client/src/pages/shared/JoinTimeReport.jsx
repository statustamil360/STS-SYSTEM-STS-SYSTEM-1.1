import { useCallback, useEffect, useState } from 'react';
import {
  Grid, TextField, MenuItem, Button, Stack, Typography, Chip, CircularProgress,
  IconButton, Tooltip, Box,
  Dialog, DialogContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeOutlined, SearchOutlined, CalendarTodayOutlined,
  DescriptionOutlined, GridOnOutlined, PictureAsPdfOutlined, ArticleOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import {
  PremiumPageCard, PremiumSection, adminFieldSx, premiumButtonSx,
} from '../../components/PremiumPageLayout';
import { PremiumDialogHeader, dialogPaperSx, dialogContentSx } from '../../components/PremiumFormFields';
import api from '../../services/api';
import { formatCalendarDate, formatDuration, formatDateKey } from '../../utils/dateTime';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';
import useReceptionistPermissions from '../../hooks/useReceptionistPermissions';

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: DescriptionOutlined, color: 'info' },
  { value: 'excel', label: 'Excel', icon: GridOnOutlined, color: 'success' },
  { value: 'pdf', label: 'PDF', icon: PictureAsPdfOutlined, color: 'error' },
  { value: 'word', label: 'Word', icon: ArticleOutlined, color: 'primary' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'gp', label: 'GP only' },
  { value: 'ahp', label: 'AHP only' },
  { value: 'guest', label: 'Guest only' },
];

const ROLE_DISPLAY = {
  gp: { label: 'GP', color: 'primary' },
  ahp: { label: 'AHP', color: 'success' },
  guest: { label: 'Guest', color: 'info' },
  guest_gp: { label: 'Guest GP', color: 'info' },
  guest_ahp: { label: 'Guest AHP', color: 'info' },
};

const formatRole = (role) => ROLE_DISPLAY[role]?.label
  || role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  || '—';

const todayIso = () => formatDateKey(new Date()) || new Date().toISOString().slice(0, 10);

const JoinTimeReport = () => {
  const { formatTime, formatStoredClock } = useSystemDateTime();
  const [filters, setFilters] = useState({
    date: todayIso(),
    patient_id: '',
    role: '',
  });
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [report, setReport] = useState(null);
  const [searched, setSearched] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const { can } = useReceptionistPermissions();
  const canExportReports = can('reports_export');

  const loadOptions = useCallback(async () => {
    try {
      const { data } = await api.get('/patients', { params: { limit: 500, status: 'active' } });
      setPatients(data.data ?? []);
    } catch {
      toast.error('Failed to load filter options');
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const buildParams = useCallback(() => {
    const params = { date: filters.date };
    if (filters.patient_id) params.patient_id = filters.patient_id;
    if (filters.role) params.role = filters.role;
    return params;
  }, [filters]);

  const fetchReport = useCallback(async () => {
    if (!filters.date) {
      toast.error('Please select a date');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get('/conferences/join-time-report', { params: buildParams() });
      setReport(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load join time report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [filters.date, buildParams]);

  usePageRefreshRegister(fetchReport);

  const handleExport = async (format) => {
    if (!filters.date) {
      toast.error('Please select a date');
      return;
    }
    setExporting(format);
    try {
      const { data } = await api.get('/conferences/join-time-report/export', {
        params: { ...buildParams(), format },
        responseType: 'blob',
      });
      const extension = { csv: 'csv', excel: 'xlsx', pdf: 'pdf', word: 'docx' }[format];
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `join-time-report-${filters.date}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const durationChip = (seconds) => (
    <Box
      sx={{
        display: 'inline-flex',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
        {formatDuration(seconds)}
      </Typography>
    </Box>
  );

  const columns = [
    {
      field: 'patient_name',
      headerName: 'Patient',
      render: (r) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {r.patient_name || '—'}
        </Typography>
      ),
    },
    {
      field: 'conference_code',
      headerName: 'Conference ID',
      render: (r) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.8125rem',
            letterSpacing: '0.02em',
            color: 'primary.main',
          }}
        >
          {r.conference_code || '—'}
        </Typography>
      ),
    },
    {
      field: 'meeting_date',
      headerName: 'Conference date',
      render: (r) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {formatCalendarDate(r.meeting_date)}
        </Typography>
      ),
    },
    {
      field: 'started_at',
      headerName: 'Start time',
      render: (r) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {r.started_at ? formatTime(r.started_at) : formatStoredClock(r.started_time, r.meeting_date)}
        </Typography>
      ),
    },
    {
      field: 'ended_at',
      headerName: 'End time',
      render: (r) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {r.ended_at ? formatTime(r.ended_at) : formatStoredClock(r.ended_time, r.meeting_date)}
        </Typography>
      ),
    },
    {
      field: 'duration_seconds',
      headerName: 'Total duration',
      render: (r) => durationChip(r.duration_seconds),
    },
  ];

  const participantColumns = [
    {
      field: 'participant_name',
      headerName: 'Participant',
      render: (r) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {r.participant_name || '—'}
        </Typography>
      ),
    },
    {
      field: 'participant_role',
      headerName: 'Role',
      render: (r) => {
        const meta = ROLE_DISPLAY[r.participant_role] || { label: formatRole(r.participant_role), color: 'default' };
        return (
          <Chip
            label={meta.label}
            size="small"
            color={meta.color}
            variant="outlined"
            sx={{ height: 22, fontWeight: 700, fontSize: '0.6875rem', letterSpacing: '0.02em' }}
          />
        );
      },
    },
    {
      field: 'duration_seconds',
      headerName: 'Stay time',
      render: (r) => durationChip(r.duration_seconds),
    },
  ];

  const exportActions = canExportReports ? (
    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
      {EXPORT_FORMATS.map((format) => {
        const Icon = format.icon;
        const busy = exporting === format.value;
        return (
          <Tooltip key={format.value} title={`Export ${format.label}`}>
            <span>
              <IconButton
                size="small"
                color={format.color}
                disabled={!report || !!exporting}
                onClick={() => handleExport(format.value)}
                aria-label={`Download ${format.label}`}
                sx={{
                  width: 36,
                  height: 36,
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette[format.color].main, 0.28),
                  bgcolor: (theme) => alpha(theme.palette[format.color].main, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette[format.color].main, 0.16),
                  },
                }}
              >
                {busy ? <CircularProgress size={16} color="inherit" /> : <Icon sx={{ fontSize: 18 }} />}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  ) : null;

  return (
    <PremiumPageCard
      icon={AccessTimeOutlined}
      title="Participant Join Time Calculator"
      subtitle="Filter by date, patient, and GP, AHP, or guest role — used for salary and payroll records"
      action={exportActions}
    >
      <Stack spacing={2.5}>
        <PremiumSection
          icon={CalendarTodayOutlined}
          title="Filters"
          subtitle="Select criteria then click Calculate"
        >
          <Grid container spacing={2} sx={{ alignItems: 'flex-end' }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="Meeting date"
                value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: <CalendarTodayOutlined sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                  },
                }}
                sx={adminFieldSx}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Patient"
                value={filters.patient_id}
                onChange={(e) => setFilters((f) => ({ ...f, patient_id: e.target.value }))}
                sx={adminFieldSx}
              >
                <MenuItem value="">All patients</MenuItem>
                {patients.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Participant role"
                value={filters.role}
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
                sx={adminFieldSx}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchOutlined />}
                onClick={fetchReport}
                disabled={loading}
                sx={{ ...premiumButtonSx, minHeight: 44 }}
              >
                Calculate
              </Button>
            </Grid>
          </Grid>
        </PremiumSection>

        <DataTable
          title="Join time details"
          columns={columns}
          rows={report?.rows ?? []}
          loading={loading}
          total={report?.rows?.length}
          page={0}
          rowsPerPage={report?.rows?.length || 10}
          onView={setViewRow}
          showRowNumbers
          embedded
          emptyTitle={searched ? `No conferences for ${formatCalendarDate(filters.date)}` : 'Select filters and calculate'}
          emptySubtitle={searched
            ? 'Choose a date with completed meetings, or start a session so join and leave times can be recorded.'
            : 'Select a date and optional filters, then click Calculate.'}
          headerActions={report?.rows?.length ? (
            <Chip
              label={`${formatCalendarDate(filters.date)} · ${report.summary.grand_total_label} meeting time`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          ) : null}
        />
      </Stack>

      <Dialog
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={PersonOutlined}
          title={viewRow ? `${viewRow.conference_code} participant times` : 'Participant times'}
          subtitle={viewRow
            ? `${viewRow.patient_name} · ${formatCalendarDate(viewRow.meeting_date)} · meeting ${viewRow.duration_label}`
            : ''}
        />
        <DialogContent sx={dialogContentSx}>
          <DataTable
            title="Stay time by participant"
            columns={participantColumns}
            rows={(viewRow?.participants ?? []).map((participant) => ({
              ...participant,
              id: participant.participant_user_id,
            }))}
            loading={false}
            total={viewRow?.participants?.length}
            page={0}
            rowsPerPage={viewRow?.participants?.length || 10}
            actions={false}
            showRowNumbers
            embedded
            emptyTitle="No participant stay times"
            emptySubtitle="No GP, AHP, or guest stay time was recorded for this conference."
          />
        </DialogContent>
      </Dialog>
    </PremiumPageCard>
  );
};

export default JoinTimeReport;
