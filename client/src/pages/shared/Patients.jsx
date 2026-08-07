import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, TextField, Grid, Button, DialogActions,
  Box, Typography, Stack, InputAdornment, alpha, Avatar, Chip, Alert, CircularProgress,
} from '@mui/material';
import {
  PersonAddOutlined, PersonOutlined, CalendarTodayOutlined, BadgeOutlined,
  PhoneOutlined, EmailOutlined, LocationOnOutlined, ContactEmergencyOutlined,
  HealthAndSafetyOutlined, NotesOutlined, WcOutlined, ContactPhoneOutlined,
  MedicalInformationOutlined, PhoneInTalkOutlined, AddLocationAltOutlined,
  CakeOutlined, KeyboardArrowDownOutlined, MedicalServicesOutlined,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx,
  handleFormDialogClose,
} from '../../components/PremiumFormFields';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { ROLES } from '../../utils/constants';
import {
  mapPatientToForm,
  buildPatientPayload,
  PATIENT_FORM_DEFAULTS,
} from '../../utils/crudHelpers';

const calculateAge = (dob) => {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
};

const formatGender = (value) => {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const yesNoFilterOptions = [
  { value: '', label: 'All' },
  { value: 'yes', label: 'Provided' },
  { value: 'no', label: 'Not Provided' },
];

const DetailRow = ({ icon: Icon, label, value }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Box
      sx={{
        p: 1.75,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        },
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            display: 'block',
            mb: 0.35,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'text.primary',
            opacity: 0.8,
            lineHeight: 1.4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.55,
            wordBreak: 'break-word',
            color: 'text.primary',
            opacity: 1,
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

const ViewSection = ({ title, icon: Icon, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.75 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
        {title}
      </Typography>
    </Stack>
    <Grid container spacing={1.5}>{children}</Grid>
  </Box>
);

const PatientViewDialog = ({ open, patient, loading, onClose }) => {
  const { formatDate } = useSystemDateTime();
  if (!open) return null;
  const fullName = patient
    ? (patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim())
    : '';
  const initials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
    : '?';
  const age = patient ? calculateAge(patient.dob) : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.22)',
          },
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          px: 3,
          pt: 3,
          pb: 4,
          flexShrink: 0,
          background: (theme) => `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          color: 'common.white',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.14) 0%, transparent 45%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                fontSize: { xs: '1.25rem', sm: '1.375rem' },
                fontWeight: 700,
                flexShrink: 0,
                bgcolor: alpha('#FFFFFF', 0.18),
                border: '2px solid',
                borderColor: alpha('#FFFFFF', 0.35),
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.125rem', sm: '1.375rem' },
                }}
              >
                {fullName || 'Patient Record'}
              </Typography>
              {patient?.patient_code && (
                <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.85, fontWeight: 500 }}>
                  {patient.patient_code}
                </Typography>
              )}
            </Box>
            <KeyboardArrowDownOutlined sx={{ fontSize: 22, opacity: 0.75, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              gap: 1,
              flexShrink: 0,
            }}
          >
            {patient?.gender && (
              <Chip
                label={formatGender(patient.gender)}
                size="small"
                sx={{ bgcolor: alpha('#FFFFFF', 0.14), color: 'common.white', fontWeight: 600, border: '1px solid', borderColor: alpha('#FFFFFF', 0.2) }}
              />
            )}
            {age && (
              <Chip
                label={`${age} years`}
                size="small"
                sx={{ bgcolor: alpha('#FFFFFF', 0.14), color: 'common.white', fontWeight: 600, border: '1px solid', borderColor: alpha('#FFFFFF', 0.2) }}
              />
            )}
            {patient?.phone && (
              <Chip
                label={patient.phone}
                size="small"
                sx={{ bgcolor: alpha('#FFFFFF', 0.12), color: 'common.white', fontWeight: 500, border: '1px solid', borderColor: alpha('#FFFFFF', 0.18) }}
              />
            )}
            {patient?.nic && (
              <Chip
                label={`Medical ID: ${patient.nic}`}
                size="small"
                sx={{ bgcolor: alpha('#FFFFFF', 0.12), color: 'common.white', fontWeight: 500, border: '1px solid', borderColor: alpha('#FFFFFF', 0.18) }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 3, overflowY: 'auto', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.015) }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : !patient ? (
          <Typography color="text.secondary" textAlign="center" py={4}>Unable to load patient details.</Typography>
        ) : (
          <>
        <ViewSection title="Personal Information" icon={PersonOutlined}>
          <DetailRow icon={BadgeOutlined} label="Patient ID" value={patient.patient_code} />
          <DetailRow icon={PersonOutlined} label="Full Name" value={fullName} />
          <DetailRow icon={CalendarTodayOutlined} label="Date of Birth" value={formatDate(patient.dob)} />
          <DetailRow icon={CakeOutlined} label="Current Age" value={age ? `${age} years` : null} />
          <DetailRow icon={BadgeOutlined} label="Medical ID" value={patient.nic} />
          <DetailRow icon={WcOutlined} label="Gender" value={formatGender(patient.gender)} />
        </ViewSection>

        <ViewSection title="Contact Details" icon={ContactPhoneOutlined}>
          <DetailRow icon={PhoneOutlined} label="Mobile" value={patient.phone} />
          <DetailRow icon={PhoneInTalkOutlined} label="Landphone" value={patient.land_phone} />
          <DetailRow icon={EmailOutlined} label="Email" value={patient.email} />
          <DetailRow icon={ContactEmergencyOutlined} label="Emergency Contact" value={patient.emergency_contact} />
          <DetailRow icon={LocationOnOutlined} label="Address" value={patient.address} />
          <DetailRow icon={AddLocationAltOutlined} label="Address 2" value={patient.address_2} />
        </ViewSection>

        <ViewSection title="Medical & Coverage" icon={MedicalInformationOutlined}>
          <DetailRow icon={HealthAndSafetyOutlined} label="Insurance" value={patient.insurance} />
          {(patient.gp_code || patient.ahp_code) && (
            <>
              <DetailRow icon={MedicalServicesOutlined} label="Assigned GP" value={patient.gp_code} />
              <DetailRow icon={HealthAndSafetyOutlined} label="Assigned AHP" value={patient.ahp_code} />
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                  }}
                >
                  <NotesOutlined sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      display: 'block',
                      mb: 0.75,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'text.primary',
                      opacity: 0.8,
                    }}
                  >
                    Medical History
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      lineHeight: 1.75,
                      whiteSpace: 'pre-wrap',
                      color: 'text.primary',
                      opacity: patient.medical_history ? 1 : 0.6,
                    }}
                  >
                    {patient.medical_history || 'No medical history recorded.'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </ViewSection>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ px: 3, borderRadius: 2, fontWeight: 600, boxShadow: '0 8px 20px rgba(30, 58, 95, 0.2)' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Patients = () => {
  const { user } = useSelector((state) => state.auth);
  const canManage = [ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [medicalIdFilter, setMedicalIdFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [gps, setGps] = useState([]);
  const [ahps, setAhps] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm({
    defaultValues: PATIENT_FORM_DEFAULTS,
  });
  const dobValue = watch('dob');
  const currentAge = calculateAge(dobValue);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const { data } = await api.get('/patients', {
        params: {
          search: search || undefined,
          gender: genderFilter || undefined,
          has_medical_id: medicalIdFilter || undefined,
          has_mobile: mobileFilter || undefined,
          has_insurance: insuranceFilter || undefined,
          sortBy,
          sortOrder,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRows(data.data ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      setRows([]);
      setTotal(0);
      const message = err.response?.data?.message || 'Failed to load patients';
      setListError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, medicalIdFilter, mobileFilter, insuranceFilter, sortBy, sortOrder, page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!canManage) return undefined;
    Promise.all([
      api.get('/staff/gps', { params: { limit: 500, status: 'active' } }),
      api.get('/staff/ahps', { params: { limit: 500, status: 'active' } }),
    ])
      .then(([gpsRes, ahpsRes]) => {
        setGps(gpsRes.data.data ?? []);
        setAhps(ahpsRes.data.data ?? []);
      })
      .catch(() => {
        toast.error('Failed to load GP/AHP options');
      });
    return undefined;
  }, [canManage]);

  const gpOptions = gps.map((g) => ({
    value: String(g.id),
    label: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.gp_code,
  }));

  const ahpOptions = ahps.map((a) => ({
    value: String(a.id),
    label: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.ahp_code,
  }));

  const handleOpen = async (row = null) => {
    setOpen(true);
    setEditRow(row);
    if (row?.id) {
      setFormLoading(true);
      try {
        const { data } = await api.get(`/patients/${row.id}`);
        const patient = data.data;
        setEditRow(patient);
        reset(mapPatientToForm(patient));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load patient details');
        reset(mapPatientToForm(row));
      } finally {
        setFormLoading(false);
      }
    } else {
      reset(mapPatientToForm(null));
    }
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
    reset(PATIENT_FORM_DEFAULTS);
  };

  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message || 'Please complete all required fields');
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = buildPatientPayload(formData);
      if (editRow) {
        await api.put(`/patients/${editRow.id}`, payload);
        toast.success('Patient updated successfully');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient created successfully');
        setPage(0);
      }
      handleCloseForm();
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleView = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewRow(null);
    try {
      const { data } = await api.get(`/patients/${row.id}`);
      setViewRow({ ...row, ...data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load patient details');
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
      await api.delete(`/patients/${pendingDelete.id}`);
      toast.success('Patient deleted successfully');
      if (rows.length <= 1 && page > 0) setPage((p) => p - 1);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete patient');
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const columns = [
    { field: 'patient_code', headerName: 'Patient ID' },
    { field: 'full_name', headerName: 'Name', render: (r) => r.full_name || `${r.first_name} ${r.last_name}` },
    { field: 'nic', headerName: 'Medical ID' },
    { field: 'phone', headerName: 'Mobile' },
    { field: 'gender', headerName: 'Gender', render: (r) => formatGender(r.gender) },
  ];

  const patientFilters = [
    {
      key: 'gender',
      label: 'Gender',
      value: genderFilter,
      onChange: (v) => { setGenderFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Genders' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      key: 'medical_id',
      label: 'Medical ID',
      value: medicalIdFilter,
      onChange: (v) => { setMedicalIdFilter(v); setPage(0); },
      options: yesNoFilterOptions,
    },
    {
      key: 'mobile',
      label: 'Mobile',
      value: mobileFilter,
      onChange: (v) => { setMobileFilter(v); setPage(0); },
      options: yesNoFilterOptions,
    },
    {
      key: 'insurance',
      label: 'Insurance',
      value: insuranceFilter,
      onChange: (v) => { setInsuranceFilter(v); setPage(0); },
      options: yesNoFilterOptions,
    },
  ];

  return (
    <>
      {listError && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>
      )}
      <DataTable
        title={isClinical ? 'Assigned Patient Records' : 'Patient Records'}
        columns={columns}
        rows={rows}
        loading={loading}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
        onSearch={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Search by name, patient ID, medical ID, phone, or email..."
        filters={patientFilters}
        serverSort
        sortField={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => { setSortBy(field); setSortOrder(order); setPage(0); }}
        actionLabel={canManage ? 'Add Patient' : undefined}
        onAction={canManage ? () => handleOpen() : undefined}
        onView={handleView}
        onEdit={canManage ? handleOpen : undefined}
        onDelete={canManage ? handleDelete : undefined}
        actions
      />

      <PatientViewDialog
        open={viewOpen}
        patient={viewRow}
        loading={viewLoading}
        onClose={() => { setViewOpen(false); setViewRow(null); }}
      />

      <Dialog
        open={open}
        onClose={handleFormDialogClose(handleCloseForm, submitting)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        disableScrollLock
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={PersonAddOutlined}
          title={editRow ? 'Edit Patient' : 'Add Patient'}
          subtitle={
            editRow
              ? 'Update patient details and contact information'
              : 'Register a new patient for scheduling and care coordination'
          }
        />

        <Box
          key={editRow?.id ?? 'new'}
          component="form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={dialogContentSx}>
            {formLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={36} />
              </Box>
            ) : (
              <>
            <SectionCard title="Personal Information" icon={PersonOutlined}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="First Name" name="first_name" icon={PersonOutlined} register={register} registerOptions={{ required: 'First name is required' }} required error={!!errors.first_name} helperText={errors.first_name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Last Name" name="last_name" icon={PersonOutlined} register={register} registerOptions={{ required: 'Last name is required' }} required error={!!errors.last_name} helperText={errors.last_name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Date of Birth" name="dob" type="date" shrink icon={CalendarTodayOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Age"
                  value={currentAge}
                  placeholder="Select DOB"
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start" sx={{ ml: 0.5 }}>
                          <CakeOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    ...fieldSx,
                    '& .MuiOutlinedInput-root': {
                      ...fieldSx['& .MuiOutlinedInput-root'],
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Medical ID" name="nic" icon={BadgeOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Gender"
                  name="gender"
                  icon={WcOutlined}
                  select
                  control={control}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </Grid>
            </SectionCard>

            {canManage && (
              <SectionCard title="Clinical Assignment" icon={MedicalServicesOutlined}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <IconField
                    label="Assigned GP"
                    name="assigned_gp_id"
                    select
                    control={control}
                    icon={MedicalServicesOutlined}
                    options={gpOptions}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <IconField
                    label="Assigned AHP"
                    name="assigned_ahp_id"
                    select
                    control={control}
                    icon={HealthAndSafetyOutlined}
                    options={ahpOptions}
                  />
                </Grid>
              </SectionCard>
            )}

            <SectionCard title="Contact Details" icon={ContactPhoneOutlined}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Mobile" name="phone" icon={PhoneOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Landphone" name="land_phone" icon={PhoneInTalkOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Address" name="address" icon={LocationOnOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Address 2" name="address_2" icon={AddLocationAltOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Email" name="email" type="email" icon={EmailOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Emergency Contact" name="emergency_contact" icon={ContactEmergencyOutlined} register={register} />
              </Grid>
            </SectionCard>

            <SectionCard title="Medical & Coverage" icon={MedicalInformationOutlined}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField label="Insurance" name="insurance" icon={HealthAndSafetyOutlined} register={register} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Medical History"
                  name="medical_history"
                  icon={NotesOutlined}
                  multiline
                  rows={3}
                  register={register}
                />
              </Grid>
            </SectionCard>
              </>
            )}
          </DialogContent>

          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel={editRow ? 'Update Patient' : 'Create Patient'}
            loading={submitting || formLoading}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Patient"
        subject={pendingDelete?.full_name || pendingDelete?.first_name || 'This patient'}
        message="Are you sure you want to remove this patient record from the system? All associated data will be permanently deleted."
        confirmLabel="Delete Patient"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </>
  );
};

export default Patients;
