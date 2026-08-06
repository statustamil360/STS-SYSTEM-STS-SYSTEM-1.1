import { useEffect, useState } from 'react';
import {
  Typography, TextField, Button, Grid, MenuItem, Stack, Alert, Box,
  CircularProgress, InputAdornment, ListSubheader,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TuneOutlined, EmailOutlined, SaveOutlined, LanguageOutlined,
  ScheduleOutlined, PaletteOutlined, AccessTimeOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import {
  PremiumPageCard, PremiumSection, adminFieldSx, premiumButtonSx,
} from '../../components/PremiumPageLayout';
import { updateSystemSettings } from '../../redux/slices/settingsSlice';
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS, getTimezoneLabel } from '../../utils/timezones';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import { formatClock } from '../../utils/dateTime';
import api from '../../services/api';

const Settings = () => {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState({
    hospital_name: '',
    timezone: DEFAULT_TIMEZONE,
    language: 'en',
    theme: 'light',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [previewNow, setPreviewNow] = useState(() => new Date());

  useEffect(() => {
    setFetching(true);
    api.get('/settings')
      .then(({ data }) => setSettings((prev) => ({ ...prev, ...data.data })))
      .catch(() => setFetchError('Failed to load settings'))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setPreviewNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', {
        hospital_name: settings.hospital_name,
        timezone: settings.timezone,
        language: settings.language,
        theme: settings.theme,
      });
      dispatch(updateSystemSettings({
        hospital_name: settings.hospital_name,
        timezone: settings.timezone,
        language: settings.language,
        theme: settings.theme,
      }));
      toast.success('Settings saved — system time updated');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = (icon) => ({
    fullWidth: true,
    size: 'small',
    disabled: fetching,
    sx: adminFieldSx,
    slotProps: {
      inputLabel: { shrink: true },
      input: icon ? {
        startAdornment: (
          <InputAdornment position="start" sx={{ ml: 0.5 }}>
            {icon}
          </InputAdornment>
        ),
      } : undefined,
    },
  });

  const preview = formatClock(previewNow, settings.timezone || DEFAULT_TIMEZONE);

  return (
    <Stack spacing={2.5}>
      {fetchError && <Alert severity="error" sx={{ borderRadius: 2 }}>{fetchError}</Alert>}

      <PremiumPageCard
        icon={TuneOutlined}
        title="System Settings"
        subtitle="Configure global hospital preferences, localization, and appearance"
      >
        {fetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={36} thickness={4} />
          </Box>
        ) : (
          <PremiumSection
            icon={TuneOutlined}
            title="General Configuration"
            subtitle="Settings stored in the database and applied platform-wide"
          >
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Hospital Name"
                  value={settings.hospital_name || ''}
                  onChange={(e) => setSettings({ ...settings, hospital_name: e.target.value })}
                  placeholder={getFieldPlaceholder('hospital_name')}
                  {...fieldProps(<TuneOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Timezone"
                  value={settings.timezone || DEFAULT_TIMEZONE}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  fullWidth
                  size="small"
                  disabled={fetching}
                  sx={adminFieldSx}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ ml: 0.5 }}>
                          <ScheduleOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                        </InputAdornment>
                      ),
                    },
                    select: {
                      MenuProps: { PaperProps: { sx: { maxHeight: 360 } } },
                    },
                  }}
                >
                  {TIMEZONE_OPTIONS.map((group) => [
                    <ListSubheader key={group.group} sx={{ fontWeight: 700, fontSize: '0.75rem', lineHeight: 2.5 }}>
                      {group.group}
                    </ListSubheader>,
                    ...group.zones.map((zone) => (
                      <MenuItem key={zone.value} value={zone.value} sx={{ fontSize: '0.8125rem' }}>
                        {zone.label}
                      </MenuItem>
                    )),
                  ])}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    flexWrap: 'wrap',
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <AccessTimeOutlined sx={{ fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      System time preview
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>
                      {preview.time}
                      <Typography component="span" variant="body2" sx={{ ml: 1, color: 'primary.main', fontWeight: 700, letterSpacing: '0.05em' }}>
                        {preview.offset || preview.zone}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {preview.dateLabel} · {getTimezoneLabel(settings.timezone || DEFAULT_TIMEZONE)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 280 }}>
                    Save settings to apply this timezone across the entire system — header clock, timestamps, and reports.
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Language"
                  value={settings.language || 'en'}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  {...fieldProps(<LanguageOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="si">Sinhala</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Default Theme"
                  value={settings.theme || 'light'}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  {...fieldProps(<PaletteOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />)}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading || fetching}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                sx={{ ...premiumButtonSx, minWidth: 160 }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </PremiumSection>
        )}
      </PremiumPageCard>

      <PremiumPageCard
        icon={EmailOutlined}
        title="Email Notifications"
        subtitle="SMTP delivery for system alerts and reminders — planned integration"
      >
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          SMTP email delivery is not configured. Contact your administrator to enable outbound email.
        </Alert>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="SMTP Host" value="" disabled placeholder="Not configured" sx={adminFieldSx} size="small" fullWidth />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="From Email" value="" disabled placeholder="Not configured" sx={adminFieldSx} size="small" fullWidth />
          </Grid>
        </Grid>
      </PremiumPageCard>
    </Stack>
  );
};

export default Settings;
