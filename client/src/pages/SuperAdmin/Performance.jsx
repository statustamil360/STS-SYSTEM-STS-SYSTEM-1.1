import {
  Alert, Card, CardContent, Typography, Grid, LinearProgress, Box, Chip, Stack, Divider,
} from '@mui/material';
import { Speed, Memory, Storage, NetworkCheck, CheckCircle, Schedule } from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';

const METRICS = [
  { title: 'CPU Usage', value: 32, icon: Speed, color: '#0284C7', status: 'Normal' },
  { title: 'Memory Usage', value: 58, icon: Memory, color: '#7C3AED', status: 'Normal' },
  { title: 'Storage', value: 45, icon: Storage, color: '#0D9488', status: 'Normal' },
  { title: 'Network', value: 92, icon: NetworkCheck, color: '#059669', status: 'Optimal' },
];

const getBarColor = (value) => {
  if (value >= 85) return 'error';
  if (value >= 70) return 'warning';
  return 'primary';
};

const Performance = () => (
  <>
    <PageHeader
      title="Performance Monitoring"
      subtitle="Platform health overview — connect live infrastructure monitoring when available"
    />

    <Alert severity="info" sx={{ mb: 3 }}>
      The metrics below are illustrative placeholders for demo purposes. They are not connected to live server monitoring APIs.
    </Alert>

    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 'none' }}>
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <CheckCircle fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                System Status
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Operational</Typography>
            <Chip label="Demo" size="small" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>All services running normally</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                Uptime
              </Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>99.9%</Typography>
            <Chip label="Demo" size="small" variant="outlined" sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Last 30 days</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              API Response
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>42ms</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label="Fast" size="small" color="success" variant="outlined" />
              <Chip label="Demo" size="small" variant="outlined" />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Active Sessions
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>1</Typography>
            <Chip label="Demo" size="small" variant="outlined" sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Currently logged in</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
      Resource Utilization
    </Typography>
    <Grid container spacing={2.5}>
      {METRICS.map((m) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.title}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${m.color}18`,
                      color: m.color,
                    }}
                  >
                    <m.icon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{m.title}</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                      <Chip label={m.status} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      <Chip label="Demo" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </Stack>
                  </Box>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{m.value}%</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={m.value}
                color={getBarColor(m.value)}
                sx={{ height: 8, borderRadius: 4, mb: 1, bgcolor: 'action.hover' }}
              />
              <Typography variant="caption" color="text.secondary">
                {m.value}% utilized of available capacity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Infrastructure Notes
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          {[
            'Database connection pool is stable with no latency spikes detected.',
            'Authentication service responding within expected thresholds.',
            'File upload storage has sufficient capacity for current workload.',
            'Scheduled backup processes completed successfully.',
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

export default Performance;
