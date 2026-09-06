import { useEffect, useState, useCallback } from 'react';
import {
  Grid, Typography, Box, Chip, Button, Stack, Alert, Skeleton, Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PeopleOutlined, VideoCallOutlined, LocalHospitalOutlined, TaskAltOutlined, EventOutlined,
  MedicalServicesOutlined, HealthAndSafetyOutlined, AdminPanelSettingsOutlined, SpeedOutlined,
  SecurityOutlined, AssessmentOutlined, SettingsOutlined, ShieldOutlined, ChevronRightOutlined,
  EventBusyOutlined, VideocamOffOutlined, BoltOutlined,
  InsertChartOutlined, TrendingUpOutlined, AccessTimeOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import ClinicalNextMeetingPanel from '../components/ClinicalNextMeetingPanel';
import api from '../services/api';
import { ROLE_LABELS, ROLES } from '../utils/constants';
import useSystemDateTime from '../hooks/useSystemDateTime';
import { formatDuration } from '../utils/dateTime';
import { sortMeetingsByCountdown } from '../hooks/useCountdown';
import SystemClock from '../components/SystemClock';
import { usePageRefreshRegister } from '../context/PageRefreshContext';
import PageLoader from '../components/PageLoader';

const STAT_CONFIG = {
  [ROLES.SUPER_ADMIN]: [
    { key: 'totalAdmins', title: 'Total Admins', icon: AdminPanelSettingsOutlined, color: 'primary.main' },
    { key: 'activeUsers', title: 'Active Users', icon: PeopleOutlined, color: 'info.main' },
    { key: 'activeConferences', title: 'Active Conferences', icon: VideoCallOutlined, color: 'secondary.main' },
    { key: 'systemHealth', title: 'System Health', icon: SpeedOutlined, color: 'success.main', isHealth: true },
  ],
  [ROLES.ADMIN]: [
    { key: 'receptionists', title: 'Total Receptionists', icon: PeopleOutlined, color: 'info.main' },
    { key: 'gps', title: 'Total GPs', icon: MedicalServicesOutlined, color: 'indigo' },
    { key: 'ahps', title: 'Total AHPs', icon: HealthAndSafetyOutlined, color: 'secondary.main' },
    { key: 'patients', title: 'Total Patients', icon: LocalHospitalOutlined, color: 'primary.main' },
    { key: 'upcomingConferences', title: 'Upcoming Conferences', icon: VideoCallOutlined, color: 'violet' },
    { key: 'todaysAppointments', title: "Today's Appointments", icon: EventOutlined, color: 'info.main' },
    { key: 'pendingTasks', title: 'Pending Tasks', icon: TaskAltOutlined, color: 'warning.main' },
  ],
  [ROLES.RECEPTIONIST]: [
    { key: 'todaysAppointments', title: "Today's Appointments", icon: EventOutlined, color: 'info.main' },
    { key: 'patients', title: 'Total Patients', icon: LocalHospitalOutlined, color: 'primary.main' },
    { key: 'upcomingConferences', title: 'Upcoming Conferences', icon: VideoCallOutlined, color: 'secondary.main' },
    { key: 'pendingTasks', title: 'Pending Tasks', icon: TaskAltOutlined, color: 'warning.main' },
    { key: 'availableGps', title: 'Available GPs', icon: MedicalServicesOutlined, color: 'indigo' },
    { key: 'availableAhps', title: 'Available AHPs', icon: HealthAndSafetyOutlined, color: 'success.main' },
  ],
  [ROLES.GP]: [
    { key: 'assignedPatients', title: 'Assigned Patients', icon: LocalHospitalOutlined, color: 'primary.main' },
    { key: 'todaysConference', title: "Today's Conference", icon: VideoCallOutlined, color: 'secondary.main' },
    { key: 'pendingNotes', title: 'Pending Notes', icon: TaskAltOutlined, color: 'warning.main' },
  ],
  [ROLES.AHP]: [
    { key: 'assignedPatients', title: 'Assigned Patients', icon: LocalHospitalOutlined, color: 'primary.main' },
    { key: 'upcomingConferences', title: 'Upcoming Conferences', icon: VideoCallOutlined, color: 'secondary.main' },
    { key: 'pendingReports', title: 'Pending Reports', icon: TaskAltOutlined, color: 'warning.main' },
  ],
};

const SUPER_ADMIN_ACTIONS = [
  { label: 'Manage Admins', path: '/admins', icon: AdminPanelSettingsOutlined },
  { label: 'Performance', path: '/performance', icon: SpeedOutlined },
  { label: 'Audit Logs', path: '/audit-logs', icon: SecurityOutlined },
  { label: 'Reports', path: '/reports', icon: AssessmentOutlined },
  { label: 'Settings', path: '/settings', icon: SettingsOutlined },
];

const ADMIN_ACTIONS = [
  { label: 'Manage Receptionists', path: '/receptionists', icon: PeopleOutlined },
  { label: 'Manage Patients', path: '/patients', icon: LocalHospitalOutlined },
  { label: 'View Reports', path: '/reports', icon: AssessmentOutlined },
  { label: 'Audit Logs', path: '/audit-logs', icon: SecurityOutlined },
  { label: 'Settings', path: '/settings', icon: SettingsOutlined },
];

const RECEPTIONIST_ACTIONS = [
  { label: 'Add Patient', path: '/patients', icon: LocalHospitalOutlined },
  { label: 'Schedule Conference', path: '/conferences', icon: VideoCallOutlined },
  { label: 'Book Appointment', path: '/appointments', icon: EventOutlined },
  { label: 'View Tasks', path: '/tasks', icon: TaskAltOutlined },
];

const GP_ACTIONS = [
  { label: 'View Conferences', path: '/conferences', icon: VideoCallOutlined },
  { label: 'Assigned Patients', path: '/patients', icon: LocalHospitalOutlined },
  { label: 'Medical Notes', path: '/medical-notes', icon: TaskAltOutlined },
];

const AHP_ACTIONS = [
  { label: 'View Conferences', path: '/conferences', icon: VideoCallOutlined },
  { label: 'Assigned Patients', path: '/patients', icon: LocalHospitalOutlined },
  { label: 'Patient Reports', path: '/patient-reports', icon: TaskAltOutlined },
];

const STATUS_COLORS = {
  scheduled: 'info',
  confirmed: 'success',
  pending: 'warning',
  completed: 'default',
  cancelled: 'error',
};

const CHART_COLORS = ['#0D9488', '#1E3A5F', '#0284C7', '#7C3AED'];

const getStatGridSize = (count) => {
  if (count <= 3) return { xs: 12, sm: 6, md: 4 };
  if (count === 4) return { xs: 12, sm: 6, md: 3 };
  if (count <= 6) return { xs: 12, sm: 6, md: 4, lg: 2 };
  return { xs: 12, sm: 6, md: 4, lg: 3 };
};

const formatTime = (value) => (value ? String(value).slice(0, 5) : '—');

const formatStatus = (status) => status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const paletteColor = (theme, accent, shade = 'main') =>
  theme.palette[accent]?.[shade] ?? theme.palette.primary[shade];

const SectionCard = ({ title, subtitle, icon: Icon, action, children, accent = 'primary' }) => (
  <Paper
    elevation={0}
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
    }}
  >
    <Box
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => alpha(paletteColor(theme, accent, 'main'), 0.02),
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: (theme) => alpha(paletteColor(theme, accent, 'main'), 0.1),
                color: `${accent}.main`,
                boxShadow: (theme) => `0 4px 12px ${alpha(paletteColor(theme, accent, 'main'), 0.15)}`,
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </Box>
          )}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>
    </Box>
    <Box sx={{ p: 2.5, flex: 1 }}>{children}</Box>
  </Paper>
);

const EmptyState = ({ icon: Icon, message }) => (
  <Stack sx={{ alignItems: 'center', justifyContent: 'center', py: 4, textAlign: 'center' }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      <Icon sx={{ fontSize: 28 }} />
    </Box>
    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
      {message}
    </Typography>
  </Stack>
);

const ListRow = ({ primary, secondary, meta, status, accent = 'primary', isLast }) => (
  <Box
    sx={{
      py: 1.5,
      borderBottom: isLast ? 'none' : '1px solid',
      borderColor: 'divider',
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: `${accent}.main`,
          boxShadow: (theme) => `0 0 0 3px ${alpha(paletteColor(theme, accent, 'main'), 0.15)}`,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
          {primary}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.25 }}>
          {meta && <AccessTimeOutlined sx={{ fontSize: 13, color: 'text.disabled' }} />}
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
            {secondary}
          </Typography>
        </Stack>
      </Box>
      {status && (
        <Chip
          label={formatStatus(status)}
          size="small"
          color={STATUS_COLORS[status] || 'default'}
          variant="outlined"
          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, flexShrink: 0 }}
        />
      )}
    </Stack>
  </Box>
);

const QuickActionsList = ({ actions, onNavigate }) => (
  <Stack spacing={1}>
    {actions.map((action) => {
      const ActionIcon = action.icon;
      return (
        <Box
          key={action.path}
          onClick={() => onNavigate(action.path)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              transform: 'translateX(4px)',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
            }}
          >
            <ActionIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>
            {action.label}
          </Typography>
          <ChevronRightOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Box>
      );
    })}
  </Stack>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { formatDate, formatDateTime, timezone } = useSystemDateTime();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [conferences, setConferences] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [activities, setActivities] = useState([]);
  const [joinTimeSummary, setJoinTimeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role;
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdmin = role === ROLES.ADMIN;
  const isReceptionist = role === ROLES.RECEPTIONIST;
  const isGp = role === ROLES.GP;
  const isAhp = role === ROLES.AHP;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isClinical = [ROLES.GP, ROLES.AHP].includes(role);
      const canViewJoinTime = [ROLES.ADMIN, ROLES.RECEPTIONIST].includes(role);
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/dashboard/appointments/today'),
        api.get('/dashboard/conferences/recent'),
        api.get('/dashboard/activity'),
        ...(isClinical ? [api.get('/conferences/schedule?range=today')] : []),
        ...(canViewJoinTime ? [api.get('/dashboard/join-time-summary')] : []),
      ];
      const results = await Promise.all(requests);
      const [statsRes, apptRes, confRes, actRes] = results;
      let idx = 4;
      const todayConfRes = isClinical ? results[idx++] : null;
      const joinTimeRes = canViewJoinTime ? results[idx] : null;
      const appts = apptRes.data.data ?? [];
      const confs = confRes.data.data ?? [];
      setStats(statsRes.data.data ?? {});
      setAppointments(appts);
      setConferences(confs);
      setActivities(actRes.data.data ?? []);
      setJoinTimeSummary(canViewJoinTime ? (joinTimeRes?.data?.data ?? null) : null);

      if (isClinical && todayConfRes) {
        const todayRows = (todayConfRes.data.data ?? [])
          .filter((c) => !['completed', 'cancelled'].includes(c.status));
        setTodayMeetings(sortMeetingsByCountdown(todayRows));
      } else {
        setTodayMeetings([]);
      }
      if (!canViewJoinTime) setJoinTimeSummary(null);
    } catch {
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, role]);

  usePageRefreshRegister(loadDashboard);

  useEffect(() => {
    if (!isGp && !isAhp) return undefined;

    const refreshTodayMeetings = () => {
      api.get('/conferences/schedule?range=today')
        .then(({ data }) => {
          const todayRows = (data.data ?? [])
            .filter((c) => !['completed', 'cancelled'].includes(c.status));
          setTodayMeetings(sortMeetingsByCountdown(todayRows));
        })
        .catch(() => {});
    };

    const timer = window.setInterval(refreshTodayMeetings, 15000);
    return () => window.clearInterval(timer);
  }, [isGp, isAhp]);

  const statCards = STAT_CONFIG[role] || [];
  const statGridSize = getStatGridSize(statCards.length);
  const displayName = user?.profile
    ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
    : user?.first_name
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : user?.email || 'User';
  const nextTodayMeeting = todayMeetings[0] || null;
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const chartData = statCards.slice(0, 4).map((s) => ({
    name: s.title.split(' ').slice(-2).join(' '),
    value: typeof stats[s.key] === 'number' ? stats[s.key] : 0,
  }));

  const quickActions = isSuperAdmin
    ? SUPER_ADMIN_ACTIONS
    : isAdmin
      ? ADMIN_ACTIONS
      : isReceptionist
        ? RECEPTIONIST_ACTIONS
        : isGp
          ? GP_ACTIONS
          : isAhp
            ? AHP_ACTIONS
            : [];

  const quickActionsSubtitle = isSuperAdmin
    ? 'Navigate to key administration areas'
    : isAdmin
      ? 'Manage hospital operations and staff'
      : isReceptionist
        ? 'Common front-desk and scheduling workflows'
        : 'Access your clinical tools and assigned caseload';

  if (loading && Object.keys(stats).length === 0) {
    return (
      <Box>
        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}
        <PageLoader message="Loading dashboard..." />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 3, borderRadius: 2.5 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 3,
          color: 'common.white',
          background: isSuperAdmin
            ? 'linear-gradient(135deg, #0B1E36 0%, #0F766E 55%, #0D9488 100%)'
            : 'linear-gradient(135deg, #0F766E 0%, #0D9488 70%, #14B8A6 100%)',
          boxShadow: '0 12px 40px rgba(13, 148, 136, 0.25)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />
        <Box sx={{ position: 'relative', p: { xs: 2.5, md: 3.5 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2 }}
          >
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                {isSuperAdmin && <ShieldOutlined sx={{ fontSize: 18, opacity: 0.9 }} />}
                <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.14em' }}>
                  {ROLE_LABELS[role]} Console
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75, letterSpacing: '-0.03em' }}>
                Welcome back, {displayName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500 }}>
                {todayLabel}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              {(isGp || isAhp) && (
                <ClinicalNextMeetingPanel
                  meeting={nextTodayMeeting}
                  userRole={role}
                  onRefresh={loadDashboard}
                />
              )}
              {(isAdmin || isSuperAdmin) && <SystemClock variant="hero" />}
              {isSuperAdmin && (
                <Chip
                  label="System operational"
                  sx={{
                    bgcolor: alpha('#FFFFFF', 0.12),
                    color: 'common.white',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: alpha('#FFFFFF', 0.22),
                  }}
                />
              )}
              {!loading && statCards[0] && !isGp && !isAhp && (
                <Chip
                  label={`${stats[statCards[0].key] ?? 0} ${statCards[0].title.toLowerCase()}`}
                  sx={{
                    bgcolor: alpha('#FFFFFF', 0.1),
                    color: 'common.white',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: alpha('#FFFFFF', 0.18),
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {loading
          ? statCards.map((s) => (
            <Grid size={statGridSize} key={s.key}>
              <Skeleton variant="rounded" height={136} sx={{ borderRadius: 3 }} />
            </Grid>
          ))
          : statCards.map((s) => (
            <Grid size={statGridSize} key={s.key}>
              <StatCard
                title={s.title}
                value={stats[s.key] ?? 0}
                icon={s.icon}
                color={s.color || 'primary.main'}
                chip={s.isHealth && stats[s.key] ? String(stats[s.key]) : undefined}
              />
            </Grid>
          ))}
      </Grid>

      <Grid container spacing={2.5}>
        {!isSuperAdmin && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5}>
              <SectionCard
                title="Today's appointments"
                subtitle={`${appointments.length} scheduled for today`}
                icon={EventOutlined}
                accent="info"
              >
                {appointments.length === 0 ? (
                  <EmptyState icon={EventBusyOutlined} message="No appointments scheduled for today." />
                ) : (
                  <Box>
                    {appointments.slice(0, 5).map((a, index, arr) => (
                      <ListRow
                        key={a.id}
                        primary={a.patient_name}
                        secondary={formatTime(a.appointment_time)}
                        status={a.status}
                        accent="info"
                        isLast={index === Math.min(arr.length, 5) - 1}
                      />
                    ))}
                  </Box>
                )}
              </SectionCard>

              <SectionCard
                title="Recent conferences"
                subtitle={`${conferences.length} in the pipeline`}
                icon={VideoCallOutlined}
                accent="secondary"
              >
                {conferences.length === 0 ? (
                  <EmptyState icon={VideocamOffOutlined} message="No recent conferences to display." />
                ) : (
                  <Box>
                    {conferences.slice(0, 5).map((c, index, arr) => (
                      <ListRow
                        key={c.id}
                        primary={c.patient_name}
                        secondary={`${formatDate(c.scheduled_date)} · ${formatTime(c.scheduled_time)}`}
                        status={c.status}
                        accent="secondary"
                        meta
                        isLast={index === Math.min(arr.length, 5) - 1}
                      />
                    ))}
                  </Box>
                )}
              </SectionCard>

              {(isAdmin || isReceptionist) && (
                <SectionCard
                  title="Participant join time"
                  subtitle={joinTimeSummary?.month_label
                    ? `${joinTimeSummary.month_label} · salary basis`
                    : 'Monthly totals for completed meetings'}
                  icon={AccessTimeOutlined}
                  accent="warning"
                  action={(
                    <Button size="small" onClick={() => navigate('/conferences?tab=history')}>
                      History
                    </Button>
                  )}
                >
                  {!joinTimeSummary ? (
                    <EmptyState icon={AccessTimeOutlined} message="No join time data for this month yet." />
                  ) : (
                    <Box>
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                          border: '1px solid',
                          borderColor: (theme) => alpha(theme.palette.warning.main, 0.18),
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Total recorded this month
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="warning.dark">
                          {formatDuration(joinTimeSummary.month_total_seconds)}
                        </Typography>
                      </Box>

                      {joinTimeSummary.by_role?.length > 0 && (
                        <Stack spacing={0.75} sx={{ mb: 2 }}>
                          {joinTimeSummary.by_role.map((r) => (
                            <Stack
                              key={r.role}
                              direction="row"
                              justifyContent="space-between"
                              sx={{
                                py: 0.75,
                                px: 1,
                                borderRadius: 1.5,
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                              }}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {formatStatus(r.role)}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {formatDuration(r.total_seconds)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}

                      {joinTimeSummary.recent_conferences?.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
                            Recent completed meetings
                          </Typography>
                          {joinTimeSummary.recent_conferences.slice(0, 5).map((c, index, arr) => (
                            <ListRow
                              key={c.id}
                              primary={c.patient_name || c.conference_code}
                              secondary={`${c.conference_code} · ${formatDuration(c.total_seconds)}`}
                              status="completed"
                              accent="warning"
                              meta
                              isLast={index === Math.min(arr.length, 5) - 1}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </SectionCard>
              )}
            </Stack>
          </Grid>
        )}

        {(isSuperAdmin || isAdmin) && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionCard
              title="Quick actions"
              subtitle={quickActionsSubtitle}
              icon={BoltOutlined}
              accent="warning"
            >
              <QuickActionsList actions={quickActions} onNavigate={navigate} />
            </SectionCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {(isReceptionist || isGp || isAhp) && (
              <SectionCard
                title="Quick actions"
                subtitle={quickActionsSubtitle}
                icon={BoltOutlined}
                accent="warning"
              >
                <QuickActionsList actions={quickActions} onNavigate={navigate} />
              </SectionCard>
            )}

            <SectionCard title="Analytics snapshot" subtitle="Key metrics at a glance" icon={InsertChartOutlined} accent="info">
              {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    {CHART_COLORS.map((color, i) => (
                      <linearGradient key={color} id={`barGradient${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(30, 58, 95, 0.04)' }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#barGradient${index % CHART_COLORS.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <EmptyState icon={InsertChartOutlined} message="No metrics available yet." />
              )}
            </SectionCard>
          </Stack>
        </Grid>

        {isSuperAdmin && (
          <Grid size={{ xs: 12 }}>
            <SectionCard
              title="Recent system activity"
              subtitle="Latest audit events across the platform"
              icon={TrendingUpOutlined}
              action={(
                <Button
                  size="small"
                  onClick={() => navigate('/audit-logs')}
                  endIcon={<ChevronRightOutlined />}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  View all logs
                </Button>
              )}
            >
              <Grid container spacing={2}>
                {activities.slice(0, 4).map((a) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={a.id}>
                    <Box
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 2.5,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 150ms ease',
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Chip
                        label={a.action?.replace(/_/g, ' ')}
                        size="small"
                        sx={{ mb: 1.25, textTransform: 'capitalize', fontWeight: 600, height: 22 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, letterSpacing: '-0.01em' }}>
                        {a.user_name || 'System'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {formatDateTime(a.created_at)}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
