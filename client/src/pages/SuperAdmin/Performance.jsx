import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Card, CardContent, Typography, Grid, LinearProgress, Box, Chip, Stack, Divider,
} from '@mui/material';
import {
  Speed, Memory, Storage, NetworkCheck, CheckCircle, Schedule, RefreshOutlined,
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from 'recharts';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROLES } from '../../utils/constants';
import PageLoader from '../../components/PageLoader';

const getBarColor = (value) => {
  if (value >= 85) return 'error';
  if (value >= 70) return 'warning';
  return 'primary';
};

const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const Performance = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const [metrics, setMetrics] = useState(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    try {
      const { data } = await api.get('/performance/metrics');
      setMetrics(data.data);
      setError('');
    } catch {
      setError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    const timer = setInterval(loadMetrics, 15000);
    return () => clearInterval(timer);
  }, [loadMetrics]);

  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    const poll = () => {
      api.get('/performance/stream')
        .then(({ data }) => setStream(data.data))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [isSuperAdmin]);

  if (loading) {
    return <PageLoader message="Loading performance dashboard..." />;
  }

  if (error || !metrics) {
    return <Alert severity="error">{error || 'No metrics available'}</Alert>;
  }

  const resources = [
    { title: 'CPU Usage', value: metrics.resources.cpu.percent, icon: Speed, color: '#0284C7', status: metrics.resources.cpu.status },
    { title: 'Memory Usage', value: metrics.resources.memory.percent, icon: Memory, color: '#7C3AED', status: metrics.resources.memory.status },
    { title: 'Storage (Uploads)', value: metrics.resources.storage.percent, icon: Storage, color: '#0D9488', status: metrics.resources.storage.status },
    { title: 'API Traffic', value: Math.min(100, metrics.resources.network.rps * 2), icon: NetworkCheck, color: '#059669', status: metrics.resources.network.status },
  ];

  const dbChartData = (stream?.db?.timeline || metrics.db.timeline || []).slice(-20).map((p) => ({
    label: formatTime(p.time),
    duration: p.durationMs,
    rows: p.rowCount,
  }));

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Chip icon={<RefreshOutlined sx={{ fontSize: 16 }} />} label="Auto-refresh 15s" size="small" variant="outlined" onClick={loadMetrics} />
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 'none' }}>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <CheckCircle fontSize="small" />
                <Typography variant="overline" sx={{ fontWeight: 700 }}>System Status</Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.status}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {metrics.dbConnections} DB connections active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Schedule fontSize="small" color="action" />
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Uptime</Typography>
              </Stack>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{metrics.uptimeHours}h</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Process runtime</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>API Response</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{metrics.apiResponseMs}ms</Typography>
              <Chip label={metrics.apiResponseMs < 100 ? 'Fast' : 'Slow'} size="small" color={metrics.apiResponseMs < 100 ? 'success' : 'warning'} variant="outlined" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Active Users</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>{metrics.activeSessions}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Registered active accounts</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Resource Utilization</Typography>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {resources.map((m) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${m.color}18`, color: m.color }}>
                      <m.icon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{m.title}</Typography>
                      <Chip label={m.status} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mt: 0.25 }} />
                    </Box>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{m.value}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(100, m.value)} color={getBarColor(m.value)} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
                {m.title === 'Storage (Uploads)' && (
                  <Typography variant="caption" color="text.secondary">{metrics.resources.storage.usedMb} MB in uploads folder</Typography>
                )}
                {m.title === 'API Traffic' && (
                  <Typography variant="caption" color="text.secondary">{metrics.resources.network.rps} req/s · {metrics.resources.network.bytesPerSec} B/s</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {isSuperAdmin && (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Database Activity (Real-time)</Typography>
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Query Duration (ms)</Typography>
                  <Box sx={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dbChartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="duration" name="Duration ms" stroke="#0D9488" fill="#0D948833" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip size="small" label={`${stream?.db?.qps ?? metrics.db.qps} queries/s`} />
                    <Chip size="small" label={`Avg ${stream?.db?.avgDurationMs ?? metrics.db.avgDurationMs}ms`} variant="outlined" />
                    <Chip size="small" label={`${metrics.db.totalQueries} total`} variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Rows Returned per Query</Typography>
                  <Box sx={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dbChartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="rows" name="Rows" stroke="#1E3A5F" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip size="small" label={`${stream?.db?.rowsPerSecond ?? metrics.db.rowsPerSecond} rows/s`} />
                    <Chip size="small" label={`${metrics.db.errors} errors`} color={metrics.db.errors ? 'error' : 'default'} variant="outlined" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>System Notes</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            {[
              `Heap memory at ${metrics.resources.memory.heapPercent}% of Node.js heap limit.`,
              `Database pool: ${metrics.dbConnections} active MySQL thread(s).`,
              `Total DB queries since server start: ${metrics.db.totalQueries}.`,
              `API requests served: ${metrics.requests.totalRequests} (${Math.round(metrics.requests.totalBytes / 1024)} KB total).`,
            ].map((note) => (
              <Stack key={note} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <CheckCircle sx={{ fontSize: 18, color: 'success.main', mt: 0.25 }} />
                <Typography variant="body2" color="text.secondary">{note}</Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};

export default Performance;
