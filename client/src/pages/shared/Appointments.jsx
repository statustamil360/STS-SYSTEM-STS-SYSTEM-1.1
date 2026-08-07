import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogContent, Grid, MenuItem, Box, Typography, Stack, IconButton,
  Button, Chip, List, ListItem, ListItemText, ListItemSecondaryAction, DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  EventOutlined, PersonOutlined, CalendarTodayOutlined, AccessTimeOutlined,
  NotesOutlined, InfoOutlined, MedicalServicesOutlined, HealthAndSafetyOutlined,
  AddOutlined, DeleteOutlined, TitleOutlined, WarningAmberOutlined, CommentOutlined,
  DescriptionOutlined, AttachFileOutlined, VideoCallOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx,
  handleFormDialogClose,
} from '../../components/PremiumFormFields';
import api from '../../services/api';
import { formatDateInput, formatTimeInput } from '../../utils/crudHelpers';

const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';

const defaultFormValues = {
  patient_id: '',
  gp_id: '',
  title: '',
  important_note: '',
  comments: '',
  appointment_date: '',
  appointment_time: '',
  patient_previous_records: '',
  notes: '',
  status: 'scheduled',
};

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const DetailRow = ({ label, value }) => (
  <Box sx={{ py: 0.75 }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
  </Box>
);

const getFirstFormError = (formErrors) => {
  for (const value of Object.values(formErrors)) {
    if (value?.message) return value.message;
  }
  return 'Please complete all required fields';
};

const emptyAhpRow = () => ({ key: Date.now() + Math.random(), profession: '', ahp_id: '' });

const validateAhpRows = (rows) => {
  const complete = rows.filter((r) => r.profession && r.ahp_id);
  if (!complete.length) return 'Add at least one profession and AHP assignment';
  const keys = complete.map((r) => `${r.profession.trim().toLowerCase()}::${r.ahp_id}`);
  if (new Set(keys).size !== keys.length) {
    return 'The same profession and AHP cannot be added twice in one appointment';
  }
  return null;
};

const Appointments = () => {
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [gps, setGps] = useState([]);
  const [ahps, setAhps] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [ahpRows, setAhpRows] = useState([emptyAhpRow()]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: defaultFormValues,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRows(data.data ?? []);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, rowsPerPage]);

  const loadFormOptions = useCallback(async () => {
    try {
      const [patientsRes, gpsRes, ahpsRes, professionsRes] = await Promise.all([
        api.get('/patients', { params: { limit: 500 } }),
        api.get('/staff/gps', { params: { limit: 500, status: 'active' } }),
        api.get('/staff/ahps', { params: { limit: 500, status: 'active' } }),
        api.get('/preferences/ahp-professions'),
      ]);
      setPatients(patientsRes.data.data ?? []);
      setGps(gpsRes.data.data ?? []);
      setAhps(ahpsRes.data.data ?? []);
      setProfessions(professionsRes.data.data ?? []);
    } catch {
      toast.error('Failed to load booking options');
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadFormOptions();
  }, [fetchData, loadFormOptions]);

  const gpOptions = useMemo(() => gps.map((g) => ({
    value: String(g.id),
    label: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.gp_code,
  })), [gps]);

  const patientOptions = useMemo(() => patients.map((p) => ({
    value: String(p.id),
    label: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
  })), [patients]);

  const professionOptions = useMemo(() => {
    const fromPrefs = professions.map((p) => p.name);
    const fromAhps = ahps.map((a) => a.profession).filter(Boolean);
    return [...new Set([...fromPrefs, ...fromAhps])].sort();
  }, [professions, ahps]);

  const getAhpsForProfession = (profession) => ahps.filter(
    (a) => a.profession === profession && a.status === 'active'
  );

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
    setSelectedFiles([]);
    setExistingFiles([]);
    reset(defaultFormValues);
    setAhpRows([emptyAhpRow()]);
  };

  const handleOpen = async (row = null) => {
    setEditRow(row);
    setSelectedFiles([]);
    setExistingFiles([]);

    if (row?.id) {
      try {
        const { data } = await api.get(`/appointments/${row.id}`);
        const appt = data.data;
        reset({
          patient_id: appt.patient_id != null ? String(appt.patient_id) : '',
          gp_id: appt.gp_id != null ? String(appt.gp_id) : '',
          title: appt.title || '',
          important_note: appt.important_note || '',
          comments: appt.comments || '',
          appointment_date: formatDateInput(appt.appointment_date),
          appointment_time: formatTimeInput(appt.appointment_time),
          patient_previous_records: appt.patient_previous_records || '',
          notes: appt.notes || '',
          status: appt.status || 'scheduled',
        });
        setAhpRows(
          appt.ahp_assignments?.length
            ? appt.ahp_assignments.map((a) => ({
              key: a.id || Date.now() + Math.random(),
              profession: a.profession,
              ahp_id: a.ahp_id != null ? String(a.ahp_id) : '',
            }))
            : [emptyAhpRow()]
        );
        setExistingFiles(appt.files || []);
      } catch {
        toast.error('Failed to load appointment details');
        return;
      }
    } else {
      reset(defaultFormValues);
      setAhpRows([emptyAhpRow()]);
    }
    setOpen(true);
  };

  const updateAhpRow = (key, field, value) => {
    setAhpRows((prev) => prev.map((row) => {
      if (row.key !== key) return row;
      if (field === 'profession') return { ...row, profession: value, ahp_id: '' };
      return { ...row, [field]: value };
    }));
  };

  const addAhpRow = () => setAhpRows((prev) => [...prev, emptyAhpRow()]);

  const removeAhpRow = (key) => {
    setAhpRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const onInvalid = (formErrors) => {
    toast.error(getFirstFormError(formErrors));
  };

  const onSubmit = async (formData) => {
    const ahpError = validateAhpRows(ahpRows);
    if (ahpError) {
      toast.error(ahpError);
      return;
    }

    setSubmitting(true);
    try {
      const assignments = ahpRows
        .filter((r) => r.profession && r.ahp_id)
        .map((r) => ({ profession: r.profession, ahp_id: Number(r.ahp_id) }));

      const body = {
        patient_id: Number(formData.patient_id),
        gp_id: Number(formData.gp_id),
        title: formData.title?.trim(),
        important_note: formData.important_note || '',
        comments: formData.comments || '',
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        patient_previous_records: formData.patient_previous_records || '',
        notes: formData.notes || '',
        ahp_assignments: assignments,
      };

      if (editRow) {
        body.status = formData.status || editRow.status;
      }

      if (selectedFiles.length > 0) {
        const payload = new FormData();
        Object.entries(body).forEach(([key, val]) => {
          payload.append(key, key === 'ahp_assignments' ? JSON.stringify(val) : String(val ?? ''));
        });
        selectedFiles.forEach((file) => payload.append('files', file));
        if (editRow) {
          await api.put(`/appointments/${editRow.id}`, payload);
        } else {
          await api.post('/appointments', payload);
        }
      } else if (editRow) {
        await api.put(`/appointments/${editRow.id}`, body);
      } else {
        await api.post('/appointments', body);
      }

      toast.success(editRow ? 'Appointment updated successfully' : 'Conference appointment booked successfully');
      handleCloseForm();
      if (!editRow) setPage(0);
      fetchData();
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      const detail = validationErrors?.[0]?.msg;
      toast.error(detail || apiMessage || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const { data } = await api.get(`/appointments/${row.id}`);
      setViewData(data.data);
    } catch {
      toast.error('Failed to load appointment details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = (row) => {
    setPendingDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/appointments/${pendingDelete.id}`);
      toast.success('Appointment deleted successfully');
      if (rows.length <= 1 && page > 0) setPage((p) => p - 1);
      fetchData();
    } catch {
      toast.error('Failed to delete appointment');
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const handleRemoveExistingFile = async (fileId) => {
    if (!editRow) return;
    try {
      await api.delete(`/appointments/${editRow.id}/files/${fileId}`);
      setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success('File removed');
    } catch {
      toast.error('Failed to remove file');
    }
  };

  const columns = [
    { field: 'appointment_code', headerName: 'ID', render: (r) => r.appointment_code || `#${r.id}` },
    { field: 'patient_name', headerName: 'Patient' },
    { field: 'gp_name', headerName: 'GP', render: (r) => r.gp_name || '—' },
    { field: 'ahp_summary', headerName: 'AHPs', render: (r) => r.ahp_summary || '—' },
    { field: 'title', headerName: 'Title', render: (r) => r.title || '—' },
    { field: 'appointment_date', headerName: 'Date' },
    { field: 'appointment_time', headerName: 'Time', render: (r) => r.appointment_time?.slice?.(0, 5) || r.appointment_time || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const appointmentFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Statuses' },
        ...APPOINTMENT_STATUS.map((s) => ({ value: s, label: formatLabel(s) })),
      ],
    },
  ];

  return (
    <>
      <DataTable
        title="Appointment Records"
        columns={columns}
        rows={rows}
        loading={loading}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
        onSearch={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Search by patient, title, ID, or notes..."
        filters={appointmentFilters}
        actionLabel="Book Appointment"
        onAction={() => handleOpen()}
        onView={handleView}
        onEdit={handleOpen}
        onDelete={handleDelete}
        actions
      />

      <Dialog
        open={open}
        onClose={handleFormDialogClose(handleCloseForm, submitting)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={EventOutlined}
          title={editRow ? 'Edit Appointment' : 'Book Conference Appointment'}
          subtitle={editRow
            ? 'Update conference schedule, participants, and patient records'
            : 'Schedule a teleconference with patient, GP, and allied health professionals'}
        />
        <Box
          key={editRow?.id ?? 'new'}
          component="form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={dialogContentSx}>
            <SectionCard title="Participants" icon={PersonOutlined}>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Patient"
                  name="patient_id"
                  select
                  control={control}
                  registerOptions={{ required: 'Patient is required' }}
                  icon={PersonOutlined}
                  showSelectPlaceholder
                  required
                  error={!!errors.patient_id}
                  helperText={errors.patient_id?.message}
                  options={patientOptions}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="General Practitioner (GP)"
                  name="gp_id"
                  select
                  control={control}
                  registerOptions={{ required: 'GP is required' }}
                  icon={MedicalServicesOutlined}
                  showSelectPlaceholder
                  required
                  error={!!errors.gp_id}
                  helperText={errors.gp_id?.message}
                  options={gpOptions}
                />
              </Grid>
            </SectionCard>

            <SectionCard title="Allied Health Professionals (AHP)" icon={HealthAndSafetyOutlined}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, gridColumn: '1 / -1' }}>
                Select a profession, then choose an AHP. Click + to add another profession and AHP.
                The same profession and AHP cannot be added twice.
              </Typography>
              {ahpRows.map((row, index) => {
                const ahpOptions = getAhpsForProfession(row.profession);
                return (
                  <Grid size={{ xs: 12 }} key={row.key}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <IconField
                          label={`Profession ${index + 1}`}
                          select
                          icon={HealthAndSafetyOutlined}
                          value={row.profession ?? ''}
                          onChange={(e) => updateAhpRow(row.key, 'profession', e.target.value)}
                          showSelectPlaceholder
                          helperText={!professionOptions.length ? 'Add professions in Preferences first' : undefined}
                          options={professionOptions.map((p) => ({ value: p, label: p }))}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <IconField
                          label={`AHP ${index + 1}`}
                          select
                          icon={PersonOutlined}
                          value={row.ahp_id !== '' && row.ahp_id != null ? String(row.ahp_id) : ''}
                          onChange={(e) => updateAhpRow(row.key, 'ahp_id', e.target.value)}
                          showSelectPlaceholder
                          disabled={!row.profession}
                          helperText={
                            !row.profession
                              ? 'Select a profession first'
                              : !ahpOptions.length
                                ? 'No AHP found for this profession'
                                : undefined
                          }
                          options={ahpOptions.map((a) => ({
                            value: String(a.id),
                            label: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.ahp_code,
                          }))}
                        />
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ pt: { sm: 0.5 }, flexShrink: 0 }}>
                        <IconButton
                          color="primary"
                          onClick={addAhpRow}
                          aria-label="Add another AHP"
                          sx={{
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                            '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                          }}
                        >
                          <AddOutlined fontSize="small" />
                        </IconButton>
                        {ahpRows.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => removeAhpRow(row.key)}
                            aria-label="Remove AHP row"
                          >
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </Stack>
                  </Grid>
                );
              })}
            </SectionCard>

            <SectionCard title="Conference Details" icon={EventOutlined}>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Title"
                  name="title"
                  icon={TitleOutlined}
                  register={register}
                  registerOptions={{ required: 'Title is required' }}
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Important Note"
                  name="important_note"
                  multiline
                  rows={2}
                  icon={WarningAmberOutlined}
                  register={register}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Comments"
                  name="comments"
                  multiline
                  rows={2}
                  icon={CommentOutlined}
                  register={register}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Date"
                  name="appointment_date"
                  type="date"
                  shrink
                  icon={CalendarTodayOutlined}
                  register={register}
                  registerOptions={{ required: 'Date is required' }}
                  required
                  error={!!errors.appointment_date}
                  helperText={errors.appointment_date?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Time"
                  name="appointment_time"
                  type="time"
                  shrink
                  icon={AccessTimeOutlined}
                  register={register}
                  registerOptions={{ required: 'Time is required' }}
                  required
                  error={!!errors.appointment_time}
                  helperText={errors.appointment_time?.message}
                />
              </Grid>
            </SectionCard>

            <SectionCard title="More Details — Patient Previous Records" icon={DescriptionOutlined}>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Previous Records (Text)"
                  name="patient_previous_records"
                  multiline
                  rows={4}
                  icon={DescriptionOutlined}
                  register={register}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                    <AttachFileOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Attach Files
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    PDF, Word, Excel, reports, images, and other document formats (max 10MB each)
                  </Typography>
                  <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2 }}>
                    Choose Files
                    <input
                      hidden
                      multiple
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles((prev) => [...prev, ...files]);
                        e.target.value = '';
                      }}
                    />
                  </Button>
                  {selectedFiles.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
                      {selectedFiles.map((file, idx) => (
                        <Chip
                          key={`${file.name}-${idx}`}
                          label={file.name}
                          size="small"
                          onDelete={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        />
                      ))}
                    </Stack>
                  )}
                  {existingFiles.length > 0 && (
                    <List dense sx={{ mt: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                      {existingFiles.map((file) => (
                        <ListItem key={file.id} divider>
                          <ListItemText
                            primary={file.original_name}
                            secondary={file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
                          />
                          <ListItemSecondaryAction>
                            <Button
                              size="small"
                              href={`${API_BASE}${file.url || `/uploads/${file.stored_name}`}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ mr: 1 }}
                            >
                              View
                            </Button>
                            <IconButton
                              edge="end"
                              size="small"
                              color="error"
                              onClick={() => handleRemoveExistingFile(file.id)}
                            >
                              <DeleteOutlined fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Internal Notes"
                  name="notes"
                  multiline
                  rows={2}
                  icon={NotesOutlined}
                  register={register}
                />
              </Grid>
              {editRow && (
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Status"
                    name="status"
                    select
                    icon={InfoOutlined}
                    control={control}
                    showSelectPlaceholder={false}
                  >
                    {APPOINTMENT_STATUS.map((s) => (
                      <MenuItem key={s} value={s}>{formatLabel(s)}</MenuItem>
                    ))}
                  </IconField>
                </Grid>
              )}
            </SectionCard>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel={editRow ? 'Update Appointment' : 'Finish & Book Appointment'}
            loading={submitting}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Appointment"
        message={`Are you sure you want to delete the appointment for ${pendingDelete?.patient_name || 'this patient'}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />

      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={EventOutlined}
          title="Appointment & Conference Details"
          subtitle="Full schedule and linked teleconference information"
        />
        <DialogContent dividers sx={dialogContentSx}>
          {viewLoading ? (
            <Typography color="text.secondary" py={4} textAlign="center">Loading details...</Typography>
          ) : viewData ? (
            <>
              <SectionCard title="Appointment" icon={EventOutlined}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Appointment ID" value={viewData.appointment_code || `#${viewData.id}`} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Status" value={formatLabel(viewData.status)} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Patient" value={viewData.patient_name} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="GP" value={viewData.gp_name} /></Grid>
                  <Grid size={{ xs: 12 }}><DetailRow label="AHP Assignments" value={viewData.ahp_summary} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Title" value={viewData.title} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailRow
                      label="Date & Time"
                      value={`${viewData.appointment_date?.slice?.(0, 10) || viewData.appointment_date} ${viewData.appointment_time?.slice?.(0, 5) || ''}`}
                    />
                  </Grid>
                  {viewData.cancelled_reason && (
                    <Grid size={{ xs: 12 }}>
                      <Chip label={`Cancel reason: ${viewData.cancelled_reason}`} color="error" variant="outlined" />
                    </Grid>
                  )}
                  {viewData.important_note && <Grid size={{ xs: 12 }}><DetailRow label="Important Note" value={viewData.important_note} /></Grid>}
                  {viewData.comments && <Grid size={{ xs: 12 }}><DetailRow label="Comments" value={viewData.comments} /></Grid>}
                  {viewData.notes && <Grid size={{ xs: 12 }}><DetailRow label="Notes" value={viewData.notes} /></Grid>}
                </Grid>
              </SectionCard>

              <SectionCard title="Linked Conference" icon={VideoCallOutlined}>
                {viewData.conference ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Conference ID" value={viewData.conference.conference_code} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Conference Status" value={formatLabel(viewData.conference.status)} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="Patient" value={viewData.conference.patient_name} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><DetailRow label="GP" value={viewData.conference.gp_name} /></Grid>
                    <Grid size={{ xs: 12 }}><DetailRow label="Participants" value={viewData.conference.participants || viewData.conference.ahp_name} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailRow
                        label="Scheduled"
                        value={`${viewData.conference.scheduled_date} ${viewData.conference.scheduled_time?.slice(0, 5)}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailRow
                        label="Accepted At"
                        value={viewData.conference.accepted_at ? new Date(viewData.conference.accepted_at).toLocaleString() : 'Not accepted'}
                      />
                    </Grid>
                    {viewData.conference.cancelled_reason && (
                      <Grid size={{ xs: 12 }}>
                        <Chip
                          label={`Conference cancelled: ${viewData.conference.cancelled_reason}`}
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                        {viewData.conference.cancelled_at && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            Cancelled at {new Date(viewData.conference.cancelled_at).toLocaleString()}
                          </Typography>
                        )}
                      </Grid>
                    )}
                    {viewData.conference.notes && (
                      <Grid size={{ xs: 12 }}><DetailRow label="Conference Notes" value={viewData.conference.notes} /></Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">No linked conference found for this appointment.</Typography>
                )}
              </SectionCard>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Appointments;
