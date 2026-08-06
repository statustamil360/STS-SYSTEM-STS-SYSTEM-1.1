import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Grid, MenuItem,
  Paper, Typography, Stack, CircularProgress, Box, Avatar,
} from '@mui/material';
import { NoteAlt, PersonSearch } from '@mui/icons-material';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { getFieldPlaceholder, getSelectSlotProps, selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { SelectPlaceholderMenuItem, handleFormDialogClose } from '../../components/PremiumFormFields';

const MedicalNotes = () => {
  const { formatDateTime } = useSystemDateTime();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingPatients(true);
    api.get('/patients', { params: { limit: 100 } })
      .then(({ data }) => setPatients(data.data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setNotes([]);
      return;
    }
    setLoadingNotes(true);
    api.get(`/patients/${selectedPatient}/notes`)
      .then(({ data }) => setNotes(data.data))
      .catch(() => toast.error('Failed to load medical notes'))
      .finally(() => setLoadingNotes(false));
  }, [selectedPatient]);

  const handleAddNote = async () => {
    if (!note.trim()) {
      toast.error('Please enter a note');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/patients/${selectedPatient}/notes`, { note });
      toast.success('Medical note added successfully');
      setOpen(false);
      setNote('');
      const { data } = await api.get(`/patients/${selectedPatient}/notes`);
      setNotes(data.data);
    } catch {
      toast.error('Failed to add medical note');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientName = patients.find((p) => String(p.id) === String(selectedPatient));

  return (
    <>
      <PageHeader
        title="Medical Notes"
        subtitle="Document clinical observations and care notes for assigned patients"
        actionLabel="Add Note"
        onAction={() => selectedPatient && setOpen(true)}
      />

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Select Patient"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              disabled={loadingPatients}
              slotProps={{
                select: {
                  ...getSelectSlotProps({
                    defaultValue: '',
                    options: patients.map((p) => ({
                      value: String(p.id),
                      label: p.full_name || `${p.first_name} ${p.last_name}`,
                    })),
                  }),
                  MenuProps: selectMenuSlotProps,
                },
              }}
            >
              <SelectPlaceholderMenuItem />
              {patients.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.full_name || `${p.first_name} ${p.last_name}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {selectedPatientName && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                  <PersonSearch fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {selectedPatientName.full_name || `${selectedPatientName.first_name} ${selectedPatientName.last_name}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPatientName.patient_code || 'Assigned patient'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Clinical Notes</Typography>
        </Box>
        {!selectedPatient ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <NoteAlt sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Select a patient to view notes</Typography>
          </Box>
        ) : loadingNotes ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No medical notes yet</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Add the first note for this patient
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {notes.map((n) => (
              <Box key={n.id} sx={{ px: 2.5, py: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{n.note}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {n.gp_name || 'GP'} — {formatDateTime(n.created_at)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={open} onClose={handleFormDialogClose(() => setOpen(false), submitting)} maxWidth="sm" fullWidth>
        <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }}>
          <DialogTitle>Add Medical Note</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={getFieldPlaceholder('note_content')}
              sx={{ mt: 0.5 }}
              required
            />
          </DialogContent>
          <FormDialogActions
            onCancel={() => setOpen(false)}
            submitLabel="Save Note"
            loading={submitting}
          />
        </form>
      </Dialog>
    </>
  );
};

export default MedicalNotes;
