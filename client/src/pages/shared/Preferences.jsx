import { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, Button, Chip,
  CircularProgress, Alert, InputAdornment, Switch, Divider, FormControlLabel, Checkbox,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TuneOutlined, HealthAndSafetyOutlined, AddOutlined, DeleteOutlined,
  Brightness4Outlined, Brightness7Outlined, DownloadOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import { updateSystemSettings } from '../../redux/slices/settingsSlice';
import { ROLES } from '../../utils/constants';

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

const Preferences = () => {
  const dispatch = useDispatch();
  const role = useSelector((state) => state.auth.user?.role);
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(role);
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [newProfession, setNewProfession] = useState('');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
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

  const fetchProfessions = useCallback(async () => {
    if (isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/preferences/ahp-professions');
      setProfessions(data.data ?? []);
    } catch {
      setError('Failed to load AHP professions');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setLoading(false);
      return;
    }
    fetchProfessions();
  }, [fetchProfessions, isAdmin]);

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

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newProfession.trim();
    if (!name) {
      toast.error('Enter a profession name');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/preferences/ahp-professions', { name });
      toast.success('Profession added successfully');
      setNewProfession('');
      fetchProfessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add profession');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await api.delete(`/preferences/ahp-professions/${pendingDelete.id}`);
      toast.success('Profession removed');
      setConfirmOpen(false);
      setPendingDelete(null);
      fetchProfessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove profession');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 3, boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)' }}>
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
            <TuneOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Preferences</Typography>
            <Typography variant="caption" color="text.secondary">
              {isAdmin ? 'Control dark mode and document download access for staff roles' : 'Manage AHP profession options'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

        {isAdmin && (
          permissionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={2.5}>
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
              <Stack spacing={0.5}>
                {ROLE_DOCUMENT_DOWNLOAD_OPTIONS.map((item) => (
                  <FormControlLabel
                    key={item.key}
                    control={
                      <Checkbox
                        checked={Boolean(docDownloadSettings[item.key])}
                        disabled={savingPermission === item.key}
                        onChange={(e) => handleDocDownloadChange(item.key, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={`Allow ${item.label} to download conference documents`}
                  />
                ))}
              </Stack>
            </Paper>
            </Stack>
          )
        )}

        {!isAdmin && (
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: alpha('#64748B', 0.18) }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}>
                <HealthAndSafetyOutlined sx={{ fontSize: 17 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>AHP Professions</Typography>
            </Stack>

            <Box component="form" onSubmit={handleAdd}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
                <TextField
                  fullWidth size="small" required label="New profession"
                  placeholder={getFieldPlaceholder('profession_name')}
                  value={newProfession} onChange={(e) => setNewProfession(e.target.value)}
                  disabled={submitting} sx={fieldSx}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: { startAdornment: <InputAdornment position="start"><AddOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} /></InputAdornment> },
                  }}
                />
                <Button type="submit" variant="contained" disabled={submitting || !newProfession.trim()}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
                  sx={{ flexShrink: 0, px: 3, borderRadius: '9999px', fontWeight: 600, minWidth: { sm: 160 } }}>
                  Add Profession
                </Button>
              </Stack>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
            ) : professions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No professions yet.</Typography>
            ) : (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {professions.map((item) => (
                  <Chip
                    key={item.id} label={item.name}
                    onDelete={() => { setPendingDelete(item); setConfirmOpen(true); }}
                    deleteIcon={deletingId === item.id ? <CircularProgress size={14} /> : <DeleteOutlined sx={{ fontSize: 16, color: 'error.main' }} />}
                    disabled={deletingId === item.id}
                    sx={{ height: 34, fontWeight: 600, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Profession"
        subject={pendingDelete?.name}
        message="Remove this profession from the AHP add form?"
        confirmLabel="Remove"
        loading={Boolean(deletingId)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </Paper>
  );
};

export default Preferences;
