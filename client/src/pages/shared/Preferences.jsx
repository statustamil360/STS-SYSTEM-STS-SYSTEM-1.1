import { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, Button, Chip,
  CircularProgress, Alert, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  TuneOutlined, HealthAndSafetyOutlined, AddOutlined, DeleteOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';

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
  '& .MuiInputLabel-asterisk': {
    color: 'error.main',
    fontWeight: 700,
  },
};

const Preferences = () => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [newProfession, setNewProfession] = useState('');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchProfessions = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchProfessions(); }, [fetchProfessions]);

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

  const handleDeleteRequest = (item) => {
    setPendingDelete(item);
    setConfirmOpen(true);
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
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
            }}
          >
            <TuneOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Preferences
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Manage AHP profession options used when adding allied health staff
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2.5,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: alpha('#64748B', 0.18),
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
              }}
            >
              <HealthAndSafetyOutlined sx={{ fontSize: 17 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              AHP Professions
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleAdd}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="New profession"
                placeholder={getFieldPlaceholder('profession_name')}
                value={newProfession}
                onChange={(e) => setNewProfession(e.target.value)}
                disabled={submitting}
                sx={fieldSx}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ ml: 0.5 }}>
                        <AddOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !newProfession.trim()}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddOutlined />}
                sx={{
                  flexShrink: 0,
                  px: 3,
                  py: 1,
                  borderRadius: '9999px',
                  fontWeight: 600,
                  minWidth: { sm: 160 },
                }}
              >
                Add Profession
              </Button>
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} thickness={4} />
            </Box>
          ) : professions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No professions yet. Add the first one above.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {professions.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  onDelete={() => handleDeleteRequest(item)}
                  deleteIcon={
                    deletingId === item.id
                      ? <CircularProgress size={14} sx={{ color: 'error.main' }} />
                      : <DeleteOutlined sx={{ fontSize: 16, color: 'error.main' }} />
                  }
                  disabled={deletingId === item.id}
                  sx={{
                    height: 34,
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    '& .MuiChip-deleteIcon': {
                      color: 'error.main',
                      opacity: 1,
                      '&:hover': { color: 'error.dark' },
                    },
                  }}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove Profession"
        subject={pendingDelete?.name}
        message="Are you sure you want to remove this profession? It will no longer appear in the AHP add form. This cannot be undone if no AHP is using it."
        confirmLabel="Remove"
        loading={Boolean(deletingId)}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </Paper>
  );
};

export default Preferences;
