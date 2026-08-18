import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, TextField,
  MenuItem, Stack, Typography, Box, IconButton, Tooltip, Paper, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PersonAddOutlined, ContentCopyOutlined, AddOutlined, GroupOutlined,
  LinkOutlined, EmailOutlined, VpnKeyOutlined, BadgeOutlined,
  VisibilityOutlined, DeleteOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import { selectMenuSlotProps } from '../utils/fieldPlaceholders';
import { fieldSx } from './PremiumFormFields';
import ConfirmDialog from './ConfirmDialog';

const CREDENTIAL_FIELDS = [
  { key: 'joinUrl', label: 'Join URL', icon: LinkOutlined },
  { key: 'guestEmail', label: 'Email', icon: EmailOutlined },
  { key: 'tempPassword', label: 'Password', icon: VpnKeyOutlined },
  { key: 'accessCode', label: 'Access Code', icon: BadgeOutlined },
];

const GuestCountChip = ({ count }) => (
  <Box
    component="span"
    sx={{
      px: 1,
      py: 0.15,
      borderRadius: '999px',
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
      color: 'primary.main',
      fontSize: '0.6875rem',
      fontWeight: 700,
    }}
  >
    {count}
  </Box>
);

const CredentialsPanel = ({ credentials, onCopy, onResetPassword, resetting }) => (
  <Paper
    elevation={0}
    sx={{
      mb: 2.5,
      p: 2.25,
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.success.main, 0.35),
      bgcolor: (theme) => alpha(theme.palette.success.main, 0.06),
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'success.dark' }}>
      Credentials for {credentials.guestName}
    </Typography>
    <Stack spacing={1.25}>
      {CREDENTIAL_FIELDS.map(({ key, label, icon: Icon }) => {
        const value = credentials[key];
        const missingPassword = key === 'tempPassword' && !value;
        return (
          <Box
            key={key}
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Icon sx={{ fontSize: 16, color: 'primary.main', mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em' }}>
                  {label}
                </Typography>
                {missingPassword ? (
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      Not stored for this guest
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onResetPassword}
                      disabled={resetting}
                      sx={{ borderRadius: '999px', fontSize: '0.6875rem', py: 0.25 }}
                    >
                      Reset password
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500, mt: 0.25 }}>
                    {value}
                  </Typography>
                )}
              </Box>
              {!missingPassword && (
                <Tooltip title={`Copy ${label}`}>
                  <IconButton size="small" onClick={() => onCopy(value, label)}>
                    <ContentCopyOutlined sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  </Paper>
);

const ConferenceGuestDialog = ({ conferenceId, open, onClose }) => {
  const [guests, setGuests] = useState([]);
  const [form, setForm] = useState({ guest_name: '', guest_email: '', guest_role: 'guest_ahp' });
  const [activeCredentials, setActiveCredentials] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);
  const [viewingId, setViewingId] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadGuests = useCallback(async () => {
    try {
      const { data } = await api.get(`/conferences/${conferenceId}/guests`);
      const list = data.data ?? [];
      setGuests(list);
      setShowAddForm(list.length === 0);
      return list;
    } catch {
      return [];
    }
  }, [conferenceId]);

  useEffect(() => {
    if (open) {
      setActiveCredentials(null);
      setViewingId(null);
      setPendingDelete(null);
      setForm({ guest_name: '', guest_email: '', guest_role: 'guest_ahp' });
      loadGuests();
    }
  }, [open, conferenceId, loadGuests]);

  const handleCreate = async () => {
    if (!form.guest_name?.trim() || !form.guest_email?.trim()) {
      toast.error('Guest name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/conferences/${conferenceId}/guests`, form);
      setActiveCredentials(data.data);
      setViewingId(data.data.id);
      toast.success('Guest access created');
      await loadGuests();
      setForm({ guest_name: '', guest_email: '', guest_role: 'guest_ahp' });
      setShowAddForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create guest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewGuest = async (guest) => {
    setViewingId(guest.id);
    setShowAddForm(false);
    try {
      const { data } = await api.get(`/conferences/${conferenceId}/guests/${guest.id}/credentials`);
      setActiveCredentials(data.data);
    } catch {
      toast.error('Failed to load guest credentials');
      setViewingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!activeCredentials?.id) return;
    setResetting(true);
    try {
      const { data } = await api.post(
        `/conferences/${conferenceId}/guests/${activeCredentials.id}/reset-password`
      );
      setActiveCredentials(data.data);
      toast.success('Password reset');
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleRemoveGuest = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/conferences/${conferenceId}/guests/${pendingDelete.id}`);
      toast.success('Guest removed');
      if (activeCredentials?.id === pendingDelete.id) {
        setActiveCredentials(null);
        setViewingId(null);
      }
      setPendingDelete(null);
      const list = await loadGuests();
      if (list.length === 0) setShowAddForm(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove guest');
    } finally {
      setDeleting(false);
    }
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const formVisible = guests.length === 0 || showAddForm;
  const submitLabel = guests.length === 0 ? 'Create Guest Access' : 'Save Guest';

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            color: 'common.white',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.primary.light} 100%)`,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#FFFFFF', 0.15),
              }}
            >
              <PersonAddOutlined />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.08em' }}>
                EXTERNAL ACCESS
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Guest Access
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, py: 3, bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Create temporary login credentials for an external GP or AHP to join this conference.
          </Typography>

          {activeCredentials && !formVisible && (
            <CredentialsPanel
              credentials={activeCredentials}
              onCopy={copy}
              onResetPassword={handleResetPassword}
              resetting={resetting}
            />
          )}

          {guests.length > 0 && !formVisible && (
            <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
              <Tooltip title="Add another guest">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddOutlined />}
                  onClick={() => {
                    setActiveCredentials(null);
                    setViewingId(null);
                    setShowAddForm(true);
                    setForm({ guest_name: '', guest_email: '', guest_role: 'guest_ahp' });
                  }}
                  sx={{ borderRadius: '999px', fontWeight: 700 }}
                >
                  Add Guest
                </Button>
              </Tooltip>
            </Stack>
          )}

          {formVisible && (
            <Paper
              elevation={0}
              sx={{
                p: 2.25,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                {guests.length === 0 ? 'Guest details' : 'New guest details'}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Guest name"
                  fullWidth
                  value={form.guest_name}
                  onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))}
                  sx={fieldSx}
                />
                <TextField
                  label="Guest email"
                  type="email"
                  fullWidth
                  value={form.guest_email}
                  onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))}
                  sx={fieldSx}
                />
                <TextField
                  select
                  label="Guest role"
                  fullWidth
                  value={form.guest_role}
                  onChange={(e) => setForm((f) => ({ ...f, guest_role: e.target.value }))}
                  sx={fieldSx}
                  slotProps={{ select: { MenuProps: selectMenuSlotProps } }}
                >
                  <MenuItem value="guest_gp">External GP</MenuItem>
                  <MenuItem value="guest_ahp">External AHP</MenuItem>
                </TextField>
              </Stack>
            </Paper>
          )}

          {guests.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                <GroupOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Active guests
                </Typography>
                <GuestCountChip count={guests.length} />
              </Stack>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                {guests.map((g, index) => (
                  <Box key={g.id}>
                    {index > 0 && <Divider />}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        px: 2,
                        py: 1.25,
                        alignItems: 'center',
                        bgcolor: viewingId === g.id ? (theme) => alpha(theme.palette.primary.main, 0.04) : 'transparent',
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {g.guest_name?.charAt(0)?.toUpperCase() || 'G'}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {g.guest_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {g.guest_email} · {g.access_code}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View credentials">
                          <IconButton
                            size="small"
                            onClick={() => handleViewGuest(g)}
                            sx={{
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                              '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                            }}
                          >
                            <VisibilityOutlined sx={{ fontSize: 16 }} color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove guest">
                          <IconButton
                            size="small"
                            onClick={() => setPendingDelete(g)}
                            sx={{
                              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                              '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.15) },
                            }}
                          >
                            <DeleteOutlined sx={{ fontSize: 16 }} color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button onClick={onClose} sx={{ fontWeight: 600 }}>
            Close
          </Button>
          {formVisible && (
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={submitting}
              sx={{ fontWeight: 700, px: 3, borderRadius: '999px' }}
            >
              {submitLabel}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove Guest Access"
        message="This guest will no longer be able to join the conference."
        subject={pendingDelete?.guest_name}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleRemoveGuest}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};

export const ConferenceGuestButton = ({ conferenceId }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        fullWidth
        size="small"
        variant="outlined"
        startIcon={<PersonAddOutlined sx={{ fontSize: 16 }} />}
        onClick={() => setOpen(true)}
        sx={{ py: 0.55, fontSize: '0.68rem', fontWeight: 700, borderRadius: '8px', mt: 0.75 }}
      >
        Add Guest / Join Link
      </Button>
      <ConferenceGuestDialog conferenceId={conferenceId} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ConferenceGuestDialog;
