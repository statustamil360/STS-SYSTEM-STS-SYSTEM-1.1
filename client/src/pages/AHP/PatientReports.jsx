import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, TextField, Paper, Typography, Stack, Box, Avatar, Button, Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DescriptionOutlined, AddOutlined, EventOutlined, BadgeOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';
import FormDialogActions from '../../components/FormDialogActions';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import {
  PremiumDialogHeader, dialogPaperSx, dialogContentSx, multilineFieldSx, handleFormDialogClose,
} from '../../components/PremiumFormFields';
import { premiumPaperSx, PremiumPageHeader, emptyStateSx, premiumButtonSx } from '../../components/PremiumPageLayout';
import ClinicalPatientLookup, { patientDisplayName, patientInitials } from '../../components/ClinicalPatientLookup';
import PageLoader from '../../components/PageLoader';

const PatientReports = () => {
  const { formatDate, formatDateTime } = useSystemDateTime();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingPatients(true);
    api.get('/patients', { params: { limit: 500, sortBy: 'full_name', sortOrder: 'asc' } })
      .then(({ data }) => setPatients(data.data ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!selectedPatient?.id) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    api.get(`/patients/${selectedPatient.id}/reports`)
      .then(({ data }) => setReports(data.data ?? []))
      .catch(() => toast.error('Failed to load patient reports'))
      .finally(() => setLoadingReports(false));
  }, [selectedPatient?.id]);

  const handleAddReport = async () => {
    if (!selectedPatient?.id) {
      toast.error('Select a patient first');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter report content');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/patients/${selectedPatient.id}/reports`, { report_content: content });
      toast.success('Patient report added successfully');
      setOpen(false);
      setContent('');
      const { data } = await api.get(`/patients/${selectedPatient.id}/reports`);
      setReports(data.data ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add patient report');
    } finally {
      setSubmitting(false);
    }
  };

  const conferenceCount = Number(selectedPatient?.conference_count) || 0;

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={premiumPaperSx}>
        <PremiumPageHeader
          icon={DescriptionOutlined}
          title="Patient Reports"
          subtitle="Look up patients assigned to you or linked through a conference, then record allied health reports"
          action={(
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => {
                if (!selectedPatient) {
                  toast.error('Select a patient to add a report');
                  return;
                }
                setOpen(true);
              }}
              sx={premiumButtonSx}
            >
              Add Report
            </Button>
          )}
        />
        <Box sx={{ p: { xs: 2, sm: 2.75 } }}>
          <ClinicalPatientLookup
            patients={patients}
            value={selectedPatient}
            onChange={setSelectedPatient}
            loading={loadingPatients}
            formatDate={formatDate}
          />

          {selectedPatient && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{
                mt: 2,
                p: 1.75,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.04),
                alignItems: { sm: 'center' },
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontWeight: 700,
                  bgcolor: 'secondary.main',
                  color: 'common.white',
                }}
              >
                {patientInitials(selectedPatient)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                  {patientDisplayName(selectedPatient)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Allied health record for this patient
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {selectedPatient.patient_code && (
                  <Chip size="small" icon={<BadgeOutlined />} label={selectedPatient.patient_code} sx={{ fontWeight: 700 }} />
                )}
                {conferenceCount > 0 && (
                  <Chip
                    size="small"
                    color="secondary"
                    variant="outlined"
                    icon={<EventOutlined />}
                    label={conferenceCount === 1 ? '1 conference' : `${conferenceCount} conferences`}
                    sx={{ fontWeight: 700 }}
                  />
                )}
                {selectedPatient.last_conference_date && (
                  <Chip
                    size="small"
                    label={`Last meeting ${formatDate(selectedPatient.last_conference_date)}`}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Stack>
          )}
        </Box>
      </Paper>

      <Paper elevation={0} sx={premiumPaperSx}>
        <Box
          sx={{
            px: { xs: 2, sm: 2.75 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Report history
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {selectedPatient
              ? `${reports.length} report${reports.length === 1 ? '' : 's'} on file`
              : 'Select a patient to review their reports'}
          </Typography>
        </Box>

        {!selectedPatient ? (
          <Box sx={{ ...emptyStateSx, m: 2.5, minHeight: 240 }}>
            <DescriptionOutlined sx={{ fontSize: 42, color: 'secondary.main', mb: 1.25, opacity: 0.7 }} />
            <Typography sx={{ fontWeight: 700 }}>Look up a patient</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
              Search patients assigned to you or included in your conference meetings.
            </Typography>
          </Box>
        ) : loadingReports ? (
          <PageLoader message="Loading patient reports..." />
        ) : reports.length === 0 ? (
          <Box sx={{ ...emptyStateSx, m: 2.5, minHeight: 240 }}>
            <Typography sx={{ fontWeight: 700 }}>No patient reports yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Add the first allied health report for this patient.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ p: { xs: 2, sm: 2.75 } }}>
            {reports.map((item) => (
              <Box
                key={item.id}
                sx={{
                  position: 'relative',
                  pl: 2.25,
                  pr: 2,
                  py: 1.75,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.divider, 0.9),
                  bgcolor: 'background.paper',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 10,
                    bottom: 10,
                    width: 4,
                    borderRadius: '0 4px 4px 0',
                    bgcolor: 'secondary.main',
                  },
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontWeight: 500 }}>
                  {item.report_content}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25, fontWeight: 600 }}>
                  {item.ahp_name || 'AHP'} · {formatDateTime(item.created_at)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog
        open={open}
        onClose={handleFormDialogClose(() => setOpen(false), submitting)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddReport(); }}>
          <PremiumDialogHeader
            icon={DescriptionOutlined}
            title="Add patient report"
            subtitle={selectedPatient ? patientDisplayName(selectedPatient) : 'Allied health report'}
          />
          <DialogContent sx={dialogContentSx}>
            <TextField
              fullWidth
              multiline
              minRows={6}
              label="Report content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={getFieldPlaceholder('report_content')}
              sx={multilineFieldSx}
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
    </Stack>
  );
};

export default PatientReports;
