import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, TextField, MenuItem, Button, Stack, Typography, Chip, CircularProgress,
  Paper, ToggleButton, ToggleButtonGroup, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  AccessTimeOutlined, SearchOutlined, CalendarTodayOutlined,
  DescriptionOutlined, GridOnOutlined, PictureAsPdfOutlined, ArticleOutlined,
  PersonOutlined, MedicalServicesOutlined, HealthAndSafetyOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import {
  PremiumPageCard, PremiumSection, adminFieldSx, premiumButtonSx, premiumPaperSx,
} from '../../components/PremiumPageLayout';
import api from '../../services/api';
import { formatCalendarDate, formatClockTime, formatDateTime, formatDuration, formatDateKey } from '../../utils/dateTime';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';

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
];

const formatRole = (role) => role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const todayIso = () => formatDateKey(new Date()) || new Date().toISOString().slice(0, 10);

const JoinTimeReport = () => {
  const [filters, setFilters] = useState({
    date: todayIso(),
    patient_id: '',
    role: '',
    staff_id: '',
  });
  const [patients, setPatients] = useState([]);
  const [gps, setGps] = useState([]);
  const [ahps, setAhps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [report, setReport] = useState(null);
  const [searched, setSearched] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [patientsRes, gpsRes, ahpsRes] = await Promise.all([
        api.get('/patients', { params: { limit: 500, status: 'active' } }),
        api.get('/staff/gps', { params: { limit: 500, status: 'active' } }),
        api.get('/staff/ahps', { params: { limit: 500, status: 'active' } }),
      ]);
      setPatients(patientsRes.data.data ?? []);
      setGps(gpsRes.data.data ?? []);
      setAhps(ahpsRes.data.data ?? []);
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
    if (filters.staff_id && filters.role === 'gp') params.gp_id = filters.staff_id;
    if (filters.staff_id && filters.role === 'ahp') params.ahp_id = filters.staff_id;
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
      if (!data.data?.rows?.length) {
        toast.info('No join time records found for the selected filters. Try another date or run a new meeting with join/leave tracking.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load join time report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [filters.date, buildParams]);

  usePageRefreshRegister(fetchReport);

  useEffect(() => {
    fetchReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

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

  const staffOptions = useMemo(() => {
    if (filters.role === 'gp') {
      return gps.map((g) => ({
        value: String(g.id),
        label: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.gp_code,
      }));
    }
    if (filters.role === 'ahp') {
      return ahps.map((a) => ({
        value: String(a.id),
        label: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.ahp_code,
      }));
    }
    return [];
  }, [filters.role, gps, ahps]);

  const columns = [
    { field: 'conference_code', headerName: 'Conference ID' },
    { field: 'patient_name', headerName: 'Patient' },
    {
      field: 'meeting_date',
      headerName: 'Date',
      render: (r) => formatCalendarDate(r.meeting_date),
    },
    {
      field: 'meeting_time',
      headerName: 'Time',
      render: (r) => formatClockTime(r.meeting_time),
    },
    { field: 'participant_name', headerName: 'Participant' },
    {
      field: 'participant_role',
      headerName: 'Role',
      render: (r) => (
        <Chip label={formatRole(r.participant_role)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
      ),
    },
    {
      field: 'joined_at',
      headerName: 'Joined',
      render: (r) => formatDateTime(r.joined_at),
    },
    {
      field: 'left_at',
      headerName: 'Left',
      render: (r) => (r.left_at ? formatDateTime(r.left_at) : '—'),
    },
    {
      field: 'duration_seconds',
      headerName: 'Duration',
      render: (r) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          {formatDuration(r.duration_seconds)}
        </Typography>
      ),
    },
  ];

  return (
    <Stack spacing={2.5}>
      <PremiumPageCard
        icon={AccessTimeOutlined}
        title="Participant Join Time Calculator"
        subtitle="Filter by date, patient, and GP/AHP role — used for salary and payroll records"
      >
        <PremiumSection
          icon={CalendarTodayOutlined}
          title="Filters"
          subtitle="Select criteria then click Calculate join times"
        >
          <Grid container spacing={2}>
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
                onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, staff_id: '' }))}
                sx={adminFieldSx}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label={filters.role === 'gp' ? 'GP (optional)' : filters.role === 'ahp' ? 'AHP (optional)' : 'Specific staff'}
                value={filters.staff_id}
                onChange={(e) => setFilters((f) => ({ ...f, staff_id: e.target.value }))}
                disabled={!filters.role}
                sx={adminFieldSx}
              >
                <MenuItem value="">
                  {filters.role ? `All ${filters.role === 'gp' ? 'GPs' : 'AHPs'}` : 'Select role first'}
                </MenuItem>
                {staffOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchOutlined />}
                  onClick={fetchReport}
                  disabled={loading}
                  sx={premiumButtonSx}
                >
                  Calculate join times
                </Button>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={filters.role || 'all'}
                  onChange={(_e, val) => {
                    if (!val) return;
                    setFilters((f) => ({
                      ...f,
                      role: val === 'all' ? '' : val,
                      staff_id: '',
                    }));
                  }}
                  sx={{ flexWrap: 'wrap' }}
                >
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="gp">
                    <MedicalServicesOutlined sx={{ fontSize: 16, mr: 0.5 }} /> GP
                  </ToggleButton>
                  <ToggleButton value="ahp">
                    <HealthAndSafetyOutlined sx={{ fontSize: 16, mr: 0.5 }} /> AHP
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>
          </Grid>
        </PremiumSection>
      </PremiumPageCard>

      {searched && !loading && report?.rows?.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No join time records for {formatCalendarDate(filters.date)} with the current filters.
          Pick a date when completed meetings were held, or run a new meeting (GP joins and ends the call) to record times.
        </Alert>
      )}

      {report && report.rows?.length > 0 && (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ ...premiumPaperSx, p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Total join time</Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {report.summary.grand_total_label}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ ...premiumPaperSx, p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Sessions</Typography>
              <Typography variant="h5" fontWeight={800}>{report.summary.session_count}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ ...premiumPaperSx, p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Participants</Typography>
              <Typography variant="h5" fontWeight={800}>{report.summary.participant_count}</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ ...premiumPaperSx, p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Meetings</Typography>
              <Typography variant="h5" fontWeight={800}>{report.summary.conference_count}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {report?.summary?.by_participant?.length > 0 && (
        <PremiumPageCard
          icon={PersonOutlined}
          title="Totals by participant"
          subtitle="Salary basis — includes all join/rejoin sessions"
        >
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {report.summary.by_participant.map((p) => (
              <Chip
                key={p.participant_user_id}
                label={`${p.participant_name} (${formatRole(p.participant_role)}): ${p.total_label}`}
                sx={{
                  fontWeight: 600,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                }}
              />
            ))}
          </Stack>
        </PremiumPageCard>
      )}

      <PremiumPageCard
        icon={DescriptionOutlined}
        title="Export report"
        subtitle="Download join time details as PDF, Word, CSV, or Excel"
      >
        <Stack direction="row" flexWrap="wrap" gap={1.5}>
          {EXPORT_FORMATS.map((format) => {
            const Icon = format.icon;
            const busy = exporting === format.value;
            return (
              <Button
                key={format.value}
                variant="outlined"
                color={format.color}
                disabled={!report || !!exporting}
                startIcon={busy ? <CircularProgress size={14} /> : <Icon />}
                onClick={() => handleExport(format.value)}
                sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
              >
                {format.label}
              </Button>
            );
          })}
        </Stack>
      </PremiumPageCard>

      <DataTable
        title="Join time details"
        columns={columns}
        rows={report?.rows ?? []}
        loading={loading}
        page={0}
        rowsPerPage={report?.rows?.length || 10}
        actions={false}
        showRowNumbers
        headerActions={report?.rows?.length ? (
          <Chip
            label={`${formatCalendarDate(filters.date)} · ${report.summary.grand_total_label} total`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        ) : null}
      />
    </Stack>
  );
};

export default JoinTimeReport;
