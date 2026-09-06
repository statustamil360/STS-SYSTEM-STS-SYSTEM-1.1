import { useEffect, useState } from 'react';
import {
  Typography, TextField, Button, Grid, MenuItem, Stack, Alert, Box,
  CircularProgress, InputAdornment, ListSubheader, Switch, FormControlLabel, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TuneOutlined, EmailOutlined, SaveOutlined, LanguageOutlined,
  ScheduleOutlined, PaletteOutlined, AccessTimeOutlined, SmsOutlined, WhatsApp,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  PremiumPageCard, PremiumSection, adminFieldSx, premiumButtonSx,
} from '../../components/PremiumPageLayout';
import { updateSystemSettings } from '../../redux/slices/settingsSlice';
import { DEFAULT_TIMEZONE, TIMEZONE_OPTIONS, getTimezoneLabel } from '../../utils/timezones';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import { formatClock } from '../../utils/dateTime';
import { ROLES } from '../../utils/constants';
import PageLoader from '../../components/PageLoader';
import PasswordTextField from '../../components/PasswordReveal';
import api from '../../services/api';

const DEFAULT_EMAIL = {
  enabled: false,
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  from_email: '',
  use_tls: true,
};

const DEFAULT_SMS = {
  enabled: false,
  provider: '',
  api_key: '',
  sender_id: '',
  api_url: '',
};

const DEFAULT_WHATSAPP = {
  enabled: false,
  provider: '',
  api_key: '',
  phone_number_id: '',
  business_account_id: '',
  api_url: '',
};

const GatewaySection = ({
  icon: Icon,
  title,
  subtitle,
  enabled,
  onEnabledChange,
  onSave,
  saving,
  children,
}) => (
  <PremiumPageCard icon={Icon} title={title} subtitle={subtitle}>
    <Stack spacing={2.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} color="success" />}
        label={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Enable {title}</Typography>
            <Typography variant="caption" color="text.secondary">Turn on outbound delivery through this gateway</Typography>
          </Box>
        }
      />
      <Divider />
      {children}
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
          sx={{ ...premiumButtonSx, minWidth: 160 }}
        >
          {saving ? 'Saving...' : 'Save Gateway'}
        </Button>
      </Stack>
    </Stack>
  </PremiumPageCard>
);

const Settings = () => {
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.user?.role);
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;

  const [settings, setSettings] = useState({
    hospital_name: '',
    timezone: DEFAULT_TIMEZONE,
    language: 'en',
    theme: 'light',
  });
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL);
  const [smsSettings, setSmsSettings] = useState(DEFAULT_SMS);
  const [whatsappSettings, setWhatsappSettings] = useState(DEFAULT_WHATSAPP);

  const [loading, setLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [previewNow, setPreviewNow] = useState(() => new Date());

  useEffect(() => {
    setFetching(true);
    api.get('/settings')
      .then(({ data }) => {
        const d = data.data || {};
        setSettings((prev) => ({ ...prev, ...d }));
        if (isSuperAdmin) {
          setEmailSettings({ ...DEFAULT_EMAIL, ...(d.email_settings || {}) });
          setSmsSettings({ ...DEFAULT_SMS, ...(d.sms_settings || {}) });
          setWhatsappSettings({ ...DEFAULT_WHATSAPP, ...(d.whatsapp_settings || {}) });
        }
      })
      .catch(() => setFetchError('Failed to load settings'))
      .finally(() => setFetching(false));
  }, [isSuperAdmin]);

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

  const saveGateway = async (key, payload, setSaving, label) => {
    setSaving(true);
    try {
      await api.put('/settings', { [key]: payload });
      toast.success(`${label} settings saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to save ${label} settings`);
    } finally {
      setSaving(false);
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

      {!isSuperAdmin && (
      <PremiumPageCard
        icon={TuneOutlined}
        title="System Settings"
        subtitle="Configure global hospital preferences, localization, and appearance"
      >
        {fetching ? (
          <PageLoader message="Loading settings..." />
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
      )}

      {isSuperAdmin && fetching && (
        <PageLoader message="Loading settings..." />
      )}

      {isSuperAdmin && !fetching && (
        <>
          <GatewaySection
            icon={EmailOutlined}
            title="Email Notifications"
            subtitle="SMTP delivery for system alerts, reminders, and guest credentials"
            enabled={emailSettings.enabled}
            onEnabledChange={(enabled) => setEmailSettings((p) => ({ ...p, enabled }))}
            onSave={() => saveGateway('email_settings', emailSettings, setEmailSaving, 'Email')}
            saving={emailSaving}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="SMTP Host"
                  value={emailSettings.smtp_host}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtp_host: e.target.value }))}
                  placeholder="smtp.example.com"
                  {...fieldProps(<EmailOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="SMTP Port"
                  type="number"
                  value={emailSettings.smtp_port}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtp_port: Number(e.target.value) || 587 }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="SMTP Username"
                  value={emailSettings.smtp_user}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtp_user: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PasswordTextField
                  label="SMTP Password"
                  value={emailSettings.smtp_password}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, smtp_password: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="From Email"
                  value={emailSettings.from_email}
                  onChange={(e) => setEmailSettings((p) => ({ ...p, from_email: e.target.value }))}
                  placeholder="noreply@amc.com"
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={
                    <Switch
                      checked={emailSettings.use_tls}
                      onChange={(e) => setEmailSettings((p) => ({ ...p, use_tls: e.target.checked }))}
                    />
                  }
                  label="Use TLS / STARTTLS"
                />
              </Grid>
            </Grid>
          </GatewaySection>

          <GatewaySection
            icon={SmsOutlined}
            title="SMS Gateway"
            subtitle="Configure SMS provider for appointment and conference alerts"
            enabled={smsSettings.enabled}
            onEnabledChange={(enabled) => setSmsSettings((p) => ({ ...p, enabled }))}
            onSave={() => saveGateway('sms_settings', smsSettings, setSmsSaving, 'SMS')}
            saving={smsSaving}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Provider"
                  value={smsSettings.provider}
                  onChange={(e) => setSmsSettings((p) => ({ ...p, provider: e.target.value }))}
                  {...fieldProps(<SmsOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />)}
                >
                  <MenuItem value="">Select provider</MenuItem>
                  <MenuItem value="twilio">Twilio</MenuItem>
                  <MenuItem value="dialog">Dialog Axiata</MenuItem>
                  <MenuItem value="mobitel">Mobitel</MenuItem>
                  <MenuItem value="custom">Custom API</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Sender ID"
                  value={smsSettings.sender_id}
                  onChange={(e) => setSmsSettings((p) => ({ ...p, sender_id: e.target.value }))}
                  placeholder="AMC-HEALTH"
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PasswordTextField
                  label="API Key / Auth Token"
                  value={smsSettings.api_key}
                  onChange={(e) => setSmsSettings((p) => ({ ...p, api_key: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="API URL"
                  value={smsSettings.api_url}
                  onChange={(e) => setSmsSettings((p) => ({ ...p, api_url: e.target.value }))}
                  placeholder="https://api.provider.com/sms/send"
                  {...fieldProps(null)}
                />
              </Grid>
            </Grid>
          </GatewaySection>

          <GatewaySection
            icon={WhatsApp}
            title="WhatsApp Gateway"
            subtitle="Configure WhatsApp Business API for patient and staff messaging"
            enabled={whatsappSettings.enabled}
            onEnabledChange={(enabled) => setWhatsappSettings((p) => ({ ...p, enabled }))}
            onSave={() => saveGateway('whatsapp_settings', whatsappSettings, setWhatsappSaving, 'WhatsApp')}
            saving={whatsappSaving}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Provider"
                  value={whatsappSettings.provider}
                  onChange={(e) => setWhatsappSettings((p) => ({ ...p, provider: e.target.value }))}
                  {...fieldProps(<WhatsApp sx={{ fontSize: 20, color: 'success.main', opacity: 0.85 }} />)}
                >
                  <MenuItem value="">Select provider</MenuItem>
                  <MenuItem value="meta">Meta Cloud API</MenuItem>
                  <MenuItem value="twilio">Twilio WhatsApp</MenuItem>
                  <MenuItem value="custom">Custom API</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Phone Number ID"
                  value={whatsappSettings.phone_number_id}
                  onChange={(e) => setWhatsappSettings((p) => ({ ...p, phone_number_id: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Business Account ID"
                  value={whatsappSettings.business_account_id}
                  onChange={(e) => setWhatsappSettings((p) => ({ ...p, business_account_id: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PasswordTextField
                  label="API Key / Access Token"
                  value={whatsappSettings.api_key}
                  onChange={(e) => setWhatsappSettings((p) => ({ ...p, api_key: e.target.value }))}
                  {...fieldProps(null)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="API URL"
                  value={whatsappSettings.api_url}
                  onChange={(e) => setWhatsappSettings((p) => ({ ...p, api_url: e.target.value }))}
                  placeholder="https://graph.facebook.com/v19.0/..."
                  {...fieldProps(null)}
                />
              </Grid>
            </Grid>
          </GatewaySection>
        </>
      )}
    </Stack>
  );
};

export default Settings;
