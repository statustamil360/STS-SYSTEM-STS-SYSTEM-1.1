import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, Button,
  CircularProgress, Switch, Divider, FormControlLabel, Checkbox,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Brightness4Outlined, DownloadOutlined, ScheduleOutlined,
  SaveOutlined, NotificationsOutlined, DashboardOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../services/api';
import { updateSystemSettings } from '../../redux/slices/settingsSlice';
import {
  setCalendarPopupEnabled,
  setTodoPopupEnabled,
  setConferencePopupEnabled,
  setTaskAlertsEnabled,
  setDashboardCardEnabled,
} from '../../redux/slices/uiSlice';
import { ROLES } from '../../utils/constants';
import { ROLE_DASHBOARD_CARDS, isDashboardCardEnabled } from '../../utils/dashboardPreferences';
import PageLoader from '../../components/PageLoader';
import MediaDeviceSetup from '../../components/MediaDeviceSetup';
import { DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES } from '../../hooks/useConferenceOpenLeadMinutes';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '9999px',
    bgcolor: 'background.paper',
    fontSize: '0.875rem',
    minHeight: 44,
    '& fieldset': { borderColor: alpha('#64748B', 0.28) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.45) },
    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
  },
  '& .MuiInputLabel-asterisk': { color: 'error.main', fontWeight: 700 },
};

const ROLE_DARK_MODE_OPTIONS = [
  { key: 'receptionist_dark_mode_allowed', label: 'Receptionist' },
  { key: 'gp_dark_mode_allowed', label: 'GP' },
  { key: 'ahp_dark_mode_allowed', label: 'AHP' },
];

const ROLE_DOCUMENT_DOWNLOAD_OPTIONS = [
  { key: 'gp_can_download_documents', label: 'GP' },
  { key: 'ahp_can_download_documents', label: 'AHP' },
];

const MAX_OPEN_LEAD_MINUTES = 720;

const PreferenceToggleRow = ({ title, description, checked, onChange, disabled, sx }) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1, px: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', ...sx }}>
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{description}</Typography>
    </Box>
    <Switch checked={checked} onChange={onChange} color="success" disabled={disabled} />
  </Stack>
);

const AlertsAndPopupsCard = ({ userId, role }) => {
  const dispatch = useDispatch();
  const calendarEnabled = useSelector((state) => state.ui.calendarPopupEnabled);
  const todoEnabled = useSelector((state) => state.ui.todoPopupEnabled);
  const conferenceEnabled = useSelector((state) => state.ui.conferencePopupEnabled);
  const taskAlertsEnabled = useSelector((state) => state.ui.taskAlertsEnabled);
  const showCalendarToggle = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP].includes(role);
  const showConferenceToggle = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP].includes(role);
  const showTaskToggle = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP].includes(role);

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
          <NotificationsOutlined sx={{ fontSize: 17 }} />
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Alerts & popups</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Choose which popups and task alerts appear while you work.
      </Typography>
      <Stack spacing={1}>
        {showCalendarToggle && (
          <PreferenceToggleRow
            title="Show calendar popup"
            description={calendarEnabled ? 'Calendar button is visible' : 'Calendar button is hidden'}
            checked={calendarEnabled}
            onChange={(e) => {
              dispatch(setCalendarPopupEnabled({ enabled: e.target.checked, userId }));
              toast.success(e.target.checked ? 'Calendar popup enabled' : 'Calendar popup disabled');
            }}
          />
        )}
        <PreferenceToggleRow
          title="Show to-do list popup"
          description={todoEnabled ? 'To-do button is visible' : 'To-do button is hidden'}
          checked={todoEnabled}
          onChange={(e) => {
            dispatch(setTodoPopupEnabled({ enabled: e.target.checked, userId }));
            toast.success(e.target.checked ? 'To-do list popup enabled' : 'To-do list popup disabled');
          }}
        />
        {showConferenceToggle && (
          <PreferenceToggleRow
            title="Today's Conferences popup"
            description={conferenceEnabled ? 'Meeting start popup is shown' : 'Meeting start popup is hidden'}
            checked={conferenceEnabled}
            onChange={(e) => {
              dispatch(setConferencePopupEnabled({ enabled: e.target.checked, userId }));
              toast.success(e.target.checked ? "Today's Conferences popup enabled" : "Today's Conferences popup disabled");
            }}
          />
        )}
        {showTaskToggle && (
          <PreferenceToggleRow
            title="Task notifications"
            description={taskAlertsEnabled ? 'New task and update toasts are shown' : 'Task alert toasts are hidden'}
            checked={taskAlertsEnabled}
            onChange={(e) => {
              dispatch(setTaskAlertsEnabled({ enabled: e.target.checked, userId }));
              toast.success(e.target.checked ? 'Task notifications enabled' : 'Task notifications disabled');
            }}
          />
        )}
      </Stack>
    </Paper>
  );
};

const DashboardCardsCard = ({ userId, role }) => {
  const dispatch = useDispatch();
  const cards = useSelector((state) => state.ui.dashboardCards);
  const options = ROLE_DASHBOARD_CARDS[role] || [];
  if (!options.length) return null;

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
          <DashboardOutlined sx={{ fontSize: 17 }} />
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Dashboard cards</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Use one switch for the top count-card row. Other dashboard sections can still be turned on or off separately.
      </Typography>
      <Stack spacing={1}>
        {options.map((item) => {
          const enabled = isDashboardCardEnabled(cards, item.key);
          return (
            <PreferenceToggleRow
              key={item.key}
              title={item.label}
              description={item.description || (enabled ? 'Visible on dashboard' : 'Hidden on dashboard')}
              checked={enabled}
              onChange={(e) => {
                dispatch(setDashboardCardEnabled({ key: item.key, enabled: e.target.checked, userId }));
                toast.success(e.target.checked ? `${item.label} enabled` : `${item.label} disabled`);
              }}
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

const DisplayPreferences = ({ userId, role }) => (
  <Stack spacing={2.5}>
    <AlertsAndPopupsCard userId={userId} role={role} />
    <DashboardCardsCard userId={userId} role={role} />
  </Stack>
);

const Preferences = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(role);
  const [darkSettings, setDarkSettings] = useState({
    dark_mode_allowed: true,
    receptionist_dark_mode_allowed: true,
    gp_dark_mode_allowed: true,
    ahp_dark_mode_allowed: true,
  });
  const [docDownloadSettings, setDocDownloadSettings] = useState({
    gp_can_download_documents: false,
    ahp_can_download_documents: false,
  });
  const [permissionsLoading, setPermissionsLoading] = useState(isAdmin);
  const [savingPermission, setSavingPermission] = useState(null);
  const [openLeadMinutes, setOpenLeadMinutes] = useState(String(DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES));
  const [savedOpenLeadMinutes, setSavedOpenLeadMinutes] = useState(String(DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES));

  useEffect(() => {
    if (!isAdmin) return;
    setPermissionsLoading(true);
    api.get('/settings')
      .then(({ data }) => {
        const d = data.data || {};
        setDarkSettings({
          dark_mode_allowed: d.dark_mode_allowed !== false,
          receptionist_dark_mode_allowed: d.receptionist_dark_mode_allowed !== false,
          gp_dark_mode_allowed: d.gp_dark_mode_allowed !== false,
          ahp_dark_mode_allowed: d.ahp_dark_mode_allowed !== false,
        });
        setDocDownloadSettings({
          gp_can_download_documents: d.gp_can_download_documents === true,
          ahp_can_download_documents: d.ahp_can_download_documents === true,
        });
        const lead = Number(d.conference_open_lead_minutes);
        const resolvedLead = String(Number.isFinite(lead) ? lead : DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES);
        setOpenLeadMinutes(resolvedLead);
        setSavedOpenLeadMinutes(resolvedLead);
      })
      .catch(() => toast.error('Failed to load dark mode settings'))
      .finally(() => setPermissionsLoading(false));
  }, [isAdmin]);

  const handleAdminSettingChange = async (settingKey, value, { state, setState, successMessage }) => {
    const previous = state[settingKey];
    setState((p) => ({ ...p, [settingKey]: value }));
    setSavingPermission(settingKey);
    try {
      await api.put('/settings', { [settingKey]: String(value) });
      dispatch(updateSystemSettings({ [settingKey]: value }));
      toast.success(successMessage);
    } catch (err) {
      setState((p) => ({ ...p, [settingKey]: previous }));
      toast.error(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleDarkSettingChange = (settingKey, value) => handleAdminSettingChange(settingKey, value, {
    state: darkSettings,
    setState: setDarkSettings,
    successMessage: 'Dark mode setting updated',
  });

  const handleDocDownloadChange = (settingKey, value) => handleAdminSettingChange(settingKey, value, {
    state: docDownloadSettings,
    setState: setDocDownloadSettings,
    successMessage: 'Document download setting updated',
  });

  const handleOpenLeadSave = async () => {
    const minutes = Number(openLeadMinutes);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > MAX_OPEN_LEAD_MINUTES) {
      toast.error(`Enter a whole number of minutes between 0 and ${MAX_OPEN_LEAD_MINUTES}`);
      return;
    }
    setSavingPermission('conference_open_lead_minutes');
    try {
      await api.put('/settings', { conference_open_lead_minutes: minutes });
      dispatch(updateSystemSettings({ conference_open_lead_minutes: minutes }));
      setOpenLeadMinutes(String(minutes));
      setSavedOpenLeadMinutes(String(minutes));
      toast.success('Meeting open time updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSavingPermission(null);
    }
  };

  if (isClinical) {
    return (
      <Stack spacing={2.5}>
        <DisplayPreferences userId={user?.id} role={role} />
        <MediaDeviceSetup />
      </Stack>
    );
  }

  if (!isAdmin) {
    return <DisplayPreferences userId={user?.id} role={role} />;
  }

  return (
    <>
      <Stack spacing={2.5}>
        {isAdmin && (
          permissionsLoading ? (
            <PageLoader message="Loading preferences..." />
          ) : (
            <Stack spacing={2.5}>
            <DisplayPreferences userId={user?.id} role={role} />
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
                  <Brightness4Outlined sx={{ fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Dark Mode Access</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Allow staff roles to switch between light and dark theme from the header.
              </Typography>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1, px: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: darkSettings.dark_mode_allowed ? 2 : 0 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Allow dark mode</Typography>
                  <Typography variant="caption" color="text.secondary">Master switch for role-based dark mode</Typography>
                </Box>
                <Switch
                  checked={darkSettings.dark_mode_allowed}
                  disabled={savingPermission === 'dark_mode_allowed'}
                  onChange={(e) => handleDarkSettingChange('dark_mode_allowed', e.target.checked)}
                  color="success"
                />
              </Stack>

              {darkSettings.dark_mode_allowed && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                    Select which roles can use dark mode:
                  </Typography>
                  <Stack spacing={0.5}>
                    {ROLE_DARK_MODE_OPTIONS.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        control={
                          <Checkbox
                            checked={Boolean(darkSettings[item.key])}
                            disabled={savingPermission === item.key}
                            onChange={(e) => handleDarkSettingChange(item.key, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={item.label}
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
                  <DownloadOutlined sx={{ fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Conference Document Download</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                By default, GP and AHP can view documents only. Enable download per role when needed.
              </Typography>
              <Stack spacing={1}>
                {ROLE_DOCUMENT_DOWNLOAD_OPTIONS.map((item) => (
                  <PreferenceToggleRow
                    key={item.key}
                    title={`Allow ${item.label} download`}
                    description={docDownloadSettings[item.key]
                      ? `${item.label} can download conference documents`
                      : `${item.label} can view documents only`}
                    checked={Boolean(docDownloadSettings[item.key])}
                    disabled={savingPermission === item.key}
                    onChange={(e) => handleDocDownloadChange(item.key, e.target.checked)}
                  />
                ))}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
                  <ScheduleOutlined sx={{ fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Meeting Open Time</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                How early a receptionist can open a conference before its assigned time. Set 0 to allow opening only at the assigned time.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
                <TextField
                  size="small"
                  type="number"
                  label="Minutes before start"
                  value={openLeadMinutes}
                  onChange={(e) => setOpenLeadMinutes(e.target.value)}
                  disabled={savingPermission === 'conference_open_lead_minutes'}
                  sx={{ ...fieldSx, maxWidth: { sm: 240 } }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: 0, max: MAX_OPEN_LEAD_MINUTES, step: 1 },
                    input: { startAdornment: <InputAdornment position="start"><ScheduleOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} /></InputAdornment> },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleOpenLeadSave}
                  disabled={savingPermission === 'conference_open_lead_minutes' || openLeadMinutes === savedOpenLeadMinutes}
                  startIcon={savingPermission === 'conference_open_lead_minutes' ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                  sx={{ flexShrink: 0, px: 3, borderRadius: '9999px', fontWeight: 600, minWidth: { sm: 160 } }}
                >
                  Save
                </Button>
              </Stack>
            </Paper>
            </Stack>
          )
        )}
      </Stack>
    </>
  );
};

export default Preferences;
