import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, TextField, Grid, MenuItem,
  Paper, Typography, Stack, Box, Avatar,
} from '@mui/material';
import { Description, PersonSearch } from '@mui/icons-material';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { getFieldPlaceholder, getSelectSlotProps, selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { SelectPlaceholderMenuItem, handleFormDialogClose } from '../../components/PremiumFormFields';
import PageLoader from '../../components/PageLoader';

const PatientReports = () => {
  const { formatDateTime } = useSystemDateTime();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingPatients(true);
    api.get('/patients', { params: { limit: 100 } })
      .then(({ data }) => setPatients(data.data ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    api.get(`/patients/${selectedPatient}/reports`)
      .then(({ data }) => setReports(data.data ?? []))
      .catch(() => toast.error('Failed to load patient reports'))
      .finally(() => setLoadingReports(false));
  }, [selectedPatient]);

  const handleAddReport = async () => {
    if (!content.trim()) {
      toast.error('Please enter report content');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/patients/${selectedPatient}/reports`, { report_content: content });
      toast.success('Patient report added successfully');
      setOpen(false);
      setContent('');
      const { data } = await api.get(`/patients/${selectedPatient}/reports`);
      setReports(data.data ?? []);
    } catch {
      toast.error('Failed to add patient report');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientName = patients.find((p) => String(p.id) === String(selectedPatient));

  if (loadingPatients) {
    return <PageLoader message="Loading patient reports..." />;
  }

  return (
    <>
      <PageHeader
        title="Patient Reports"
        subtitle="Create and review allied health reports for assigned patients"
        actionLabel="Add Report"
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
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Report History</Typography>
        </Box>
        {!selectedPatient ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Description sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>Select a patient to view reports</Typography>
          </Box>
        ) : loadingReports ? (
          <PageLoader message="Loading patient reports..." />
        ) : reports.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>No patient reports yet</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Add the first report for this patient
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {reports.map((r) => (
              <Box key={r.id} sx={{ px: 2.5, py: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{r.report_content}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {r.ahp_name || 'AHP'} — {formatDateTime(r.created_at)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={open} onClose={handleFormDialogClose(() => setOpen(false), submitting)} maxWidth="sm" fullWidth>
        <form onSubmit={(e) => { e.preventDefault(); handleAddReport(); }}>
          <DialogTitle>Add Patient Report</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Report Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getFieldPlaceholder('report_content')}
              sx={{ mt: 0.5 }}
              required
            />
          </DialogContent>
          <FormDialogActions
            onCancel={() => setOpen(false)}
            submitLabel="Save Report"
            loading={submitting}
          />
        </form>
      </Dialog>
    </>
  );
};

export default PatientReports;
