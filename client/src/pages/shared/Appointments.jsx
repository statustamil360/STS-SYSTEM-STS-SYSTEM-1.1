import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Dialog, DialogContent, Grid, MenuItem, Box, Typography, Stack, IconButton,
  Button, Chip, List, ListItem, ListItemText, ListItemSecondaryAction, DialogActions, Alert,
  Autocomplete, TextField, CircularProgress, FormControlLabel, Checkbox,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
  EventOutlined, PersonOutlined, CalendarTodayOutlined, AccessTimeOutlined,
  NotesOutlined, InfoOutlined, MedicalServicesOutlined, HealthAndSafetyOutlined,
  AddOutlined, DeleteOutlined, TitleOutlined, WarningAmberOutlined,
  DescriptionOutlined, VideoCallOutlined, BadgeOutlined,
  ScheduleOutlined, InsertDriveFileOutlined,
  CheckCircleOutlined, CakeOutlined, GroupOutlined, VideocamOutlined, VideocamOffOutlined,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx,
  handleFormDialogClose,
} from '../../components/PremiumFormFields';
import api from '../../services/api';
import useRolePermissions from '../../hooks/useRolePermissions';
import useReceptionistPermissions from '../../hooks/useReceptionistPermissions';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';
import useLiveRefresh from '../../hooks/useLiveRefresh';
import { formatDateInput, formatTimeInput } from '../../utils/crudHelpers';
import { formatCalendarDate, formatClockTime } from '../../utils/dateTime';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { STATUS_COLORS } from '../../utils/constants';
import { openAppointmentFilePreview } from '../../utils/filePreview';
import useProgressiveTable from '../../hooks/useProgressiveTable';
import FileDropZone from '../../components/FileDropZone';

const APPOINTMENT_STATUS = ['scheduled', 'confirmed', 'cancelled'];

const CANCEL_REASON_OPTIONS = [
  { key: 'time_over', label: 'Time over the meeting' },
  { key: 'patient_request', label: 'Patient requested cancellation' },
  { key: 'clinician_unavailable', label: 'Clinician unavailable' },
  { key: 'other', label: 'Other' },
];

const parseCancelledReason = (reason) => {
  const selected = [];
  let remaining = String(reason || '');
  CANCEL_REASON_OPTIONS.filter((opt) => opt.key !== 'other').forEach((opt) => {
    if (remaining.includes(opt.label)) {
      selected.push(opt.key);
      remaining = remaining.replace(opt.label, '');
    }
  });
  remaining = remaining.replace(/Other:\s*/i, '').replace(/[;|,]+/g, ' ').trim();
  if (remaining) {
    selected.push('other');
  }
  return { selected, other: remaining };
};

const buildCancelledReason = (selected, otherText) => {
  const parts = CANCEL_REASON_OPTIONS
    .filter((opt) => opt.key !== 'other' && selected.includes(opt.key))
    .map((opt) => opt.label);
  if (selected.includes('other')) {
    const extra = otherText.trim();
    parts.push(extra ? `Other: ${extra}` : 'Other');
  }
  return parts.join('; ').slice(0, 255);
};

const defaultFormValues = {
  patient_id: '',
  title: '',
  important_note: '',
  appointment_date: '',
  appointment_time: '',
  patient_previous_records: '',
  notes: '',
  status: 'scheduled',
  record_meeting: false,
};

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

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

const patientAgeLabel = (dob) => {
  const age = calculateAge(dob);
  return age ? `${age} years` : '—';
};

const DetailItem = ({ icon: Icon, label, value, span = 6, mono = false }) => (
  <Grid size={{ xs: 12, sm: span }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          color: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            wordBreak: 'break-word',
            ...(mono && {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.02em',
            }),
          }}
        >
          {value || '—'}
        </Typography>
      </Box>
    </Stack>
  </Grid>
);

const NotePanel = ({ icon: Icon, label, value, tone = 'primary' }) => (
  <Grid size={{ xs: 12 }}>
    <Box
      sx={{
        p: 2,
        borderRadius: '14px',
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.24),
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.05),
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
        <Icon sx={{ fontSize: 17, color: `${tone}.main` }} />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: `${tone}.main`,
          }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Box>
  </Grid>
);

const ViewTopicCard = ({ tone = 'primary', icon: Icon, title, hint, children }) => (
  <Box
    sx={{
      mb: 2.5,
      height: '100%',
      borderRadius: 2.5,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette[tone].main, 0.22),
      bgcolor: 'background.paper',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    }}
  >
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.18)} 0%, ${alpha(theme.palette[tone].main, 0.05)} 100%)`,
        borderBottom: '1px solid',
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.16),
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: `${tone}.main`,
            color: 'common.white',
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.25, color: `${tone}.dark` }}
          >
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {hint}
          </Typography>
        </Box>
      </Stack>
    </Box>
    <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Grid container spacing={2.5}>{children}</Grid>
    </Box>
  </Box>
);

const InfoTile = ({ icon: Icon, label, value, mono = false }) => (
  <Box
    sx={{
      px: 1.75,
      py: 1.5,
      height: '100%',
      borderRadius: 2,
      border: '1px solid',
      borderColor: (theme) => alpha(theme.palette.divider, 0.95),
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
    }}
  >
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.5 }}>
      <Icon sx={{ fontSize: 15, color: 'primary.main' }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}
      >
        {label}
      </Typography>
    </Stack>
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        wordBreak: 'break-word',
        ...(mono && { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }),
      }}
    >
      {value || '—'}
    </Typography>
  </Box>
);

const getFirstFormError = (formErrors) => {
  for (const value of Object.values(formErrors)) {
    if (value?.message) return value.message;
  }
  return 'Please complete all required fields';
};

const emptyGpRow = () => ({ key: Date.now() + Math.random(), gp_id: '' });

const emptyAhpRow = () => ({ key: Date.now() + Math.random(), profession: '', ahp_id: '' });

const validateGpRows = (rows) => {
  const selected = rows.filter((r) => r.gp_id);
  if (!selected.length) return 'Assign at least one GP';
  const ids = selected.map((r) => String(r.gp_id));
  if (new Set(ids).size !== ids.length) return 'The same GP cannot be added twice in one appointment';
  return null;
};

const validateAhpRows = (rows) => {
  const complete = rows.filter((r) => r.profession && r.ahp_id);
  if (!complete.length) return 'Add at least one profession and AHP assignment';
  const ahpIds = complete.map((r) => String(r.ahp_id));
  if (new Set(ahpIds).size !== ahpIds.length) {
    return 'The same AHP cannot be added twice in one appointment';
  }
  return null;
};

const patientDisplayName = (patient) => (
  patient?.full_name
  || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim()
  || '—'
);

const PatientSearchField = ({
  control,
  error,
  helperText,
  selectedPatient,
  onSelectedPatient,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState(selectedPatient ? [selectedPatient] : []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = inputValue.trim();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (query.length < 1) {
        setOptions(selectedPatient ? [selectedPatient] : []);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get('/patients', { params: { search: query, limit: 25 } });
        if (cancelled) return;
        const rows = data.data ?? [];
        if (selectedPatient && !rows.some((row) => String(row.id) === String(selectedPatient.id))) {
          setOptions([selectedPatient, ...rows]);
        } else {
          setOptions(rows);
        }
      } catch {
        if (!cancelled) setOptions(selectedPatient ? [selectedPatient] : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue, selectedPatient]);

  return (
    <Controller
      name="patient_id"
      control={control}
      rules={{ required: 'Patient is required' }}
      render={({ field }) => {
        const value = options.find((row) => String(row.id) === String(field.value))
          || (selectedPatient && String(selectedPatient.id) === String(field.value) ? selectedPatient : null);
        return (
          <Autocomplete
            options={options}
            value={value}
            inputValue={inputValue}
            loading={loading}
            autoComplete
            includeInputInList
            filterOptions={(items) => items}
            noOptionsText={
              loading
                ? 'Searching patients...'
                : (inputValue.trim() ? 'No matching patients' : 'Type a letter to search patients')
            }
            getOptionLabel={(option) => {
              if (!option || typeof option === 'string') return option || '';
              const name = patientDisplayName(option);
              return option.patient_code ? `${name} · ${option.patient_code}` : name;
            }}
            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
            onChange={(_, patient) => {
              field.onChange(patient ? String(patient.id) : '');
              onSelectedPatient(patient || null);
              if (patient) setInputValue(patientDisplayName(patient));
            }}
            onInputChange={(_, next, reason) => {
              if (reason === 'reset') return;
              setInputValue(next);
              if (reason === 'clear' || next === '') {
                field.onChange('');
                onSelectedPatient(null);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Patient"
                placeholder="Type a letter — name, patient ID, or phone"
                error={error}
                helperText={helperText}
                sx={fieldSx}
                InputLabelProps={{ shrink: true, ...params.InputLabelProps }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <PersonOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85, mr: 0.5 }} />
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.InputProps?.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        );
      }}
    />
  );
};

const Appointments = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const highlightHandledRef = useRef(false);
  const { canCreate, canEdit, canDelete } = useRolePermissions('appointments');
  const { can } = useReceptionistPermissions();
  const canRecordMeeting = can('conference_record');
  const { formatDateTime } = useSystemDateTime();
  const [gps, setGps] = useState([]);
  const [ahps, setAhps] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [assigners, setAssigners] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateScopeFilter, setDateScopeFilter] = useState('');
  const [gpFilter, setGpFilter] = useState('');
  const [assignedByFilter, setAssignedByFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [gpRows, setGpRows] = useState([emptyGpRow()]);
  const [ahpRows, setAhpRows] = useState([emptyAhpRow()]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [highlightAppointmentId, setHighlightAppointmentId] = useState(null);
  const [highlightLabel, setHighlightLabel] = useState('');
  const [cancelReasons, setCancelReasons] = useState([]);
  const [cancelOtherText, setCancelOtherText] = useState('');

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: defaultFormValues,
  });
  const statusValue = watch('status');

  const fetchAppointments = useCallback(async ({ page: pageNum, limit }) => {
    const { data } = await api.get('/appointments', {
      params: {
        scope: 'records',
        search: search || undefined,
        status: statusFilter || undefined,
        date_scope: dateScopeFilter || undefined,
        gp_id: gpFilter || undefined,
        assigned_by: assignedByFilter || undefined,
        page: pageNum,
        limit,
      },
    });
    if (Array.isArray(data.assigners)) setAssigners(data.assigners);
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [search, statusFilter, dateScopeFilter, gpFilter, assignedByFilter]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload, error,
  } = useProgressiveTable(fetchAppointments);

  const loadFormOptions = useCallback(async () => {
    try {
      const [gpsRes, ahpsRes, professionsRes] = await Promise.all([
        api.get('/staff/gps', { params: { limit: 500, status: 'active' } }),
        api.get('/staff/ahps', { params: { limit: 500, status: 'active' } }),
        api.get('/preferences/ahp-professions'),
      ]);
      setGps(gpsRes.data.data ?? []);
      setAhps(ahpsRes.data.data ?? []);
      setProfessions(professionsRes.data.data ?? []);
    } catch {
      toast.error('Failed to load booking options');
    }
  }, []);

  useEffect(() => {
    loadFormOptions();
  }, [loadFormOptions]);

  useEffect(() => {
    if (error) toast.error('Failed to load appointments');
  }, [error]);

  usePageRefreshRegister(reload);
  useLiveRefresh('schedule:refresh', reload);

  useEffect(() => {
    const targetId = location.state?.highlightAppointmentId;
    if (!targetId || highlightHandledRef.current) return undefined;

    highlightHandledRef.current = true;

    const resolveHighlight = async () => {
      try {
        const { data } = await api.get(`/appointments/${targetId}`);
        const appt = data.data;
        const label = appt.appointment_code || `#${appt.id}`;
        setHighlightAppointmentId(Number(appt.id));
        setHighlightLabel(label);
        setSearch(label);
        setPage(0);
        toast.info(`Showing appointment ${label} — use View, Edit, or Delete in the table below.`);
      } catch {
        toast.error('Could not find the linked appointment');
      } finally {
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    resolveHighlight();
    return undefined;
  }, [location.state?.highlightAppointmentId, location.pathname, navigate, setPage]);

  const gpOptions = useMemo(() => gps.map((g) => ({
    value: String(g.id),
    label: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.gp_code,
  })), [gps]);

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
    setGpRows([emptyGpRow()]);
    setAhpRows([emptyAhpRow()]);
    setSelectedPatient(null);
    setCancelReasons([]);
    setCancelOtherText('');
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
          title: appt.title || '',
          important_note: appt.important_note || '',
          appointment_date: formatDateInput(appt.appointment_date),
          appointment_time: formatTimeInput(appt.appointment_time),
          patient_previous_records: appt.patient_previous_records || '',
          notes: appt.notes || '',
          status: appt.status || 'scheduled',
          record_meeting: Boolean(Number(appt.record_meeting)),
        });
        setGpRows(
          appt.gp_ids?.length
            ? appt.gp_ids.map((gpId) => ({
              key: `gp-${gpId}`,
              gp_id: String(gpId),
            }))
            : [emptyGpRow()]
        );
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
        setSelectedPatient({
          id: appt.patient_id,
          patient_code: appt.patient_code,
          full_name: appt.patient_name,
        });
        const parsed = parseCancelledReason(appt.cancelled_reason);
        setCancelReasons(parsed.selected);
        setCancelOtherText(parsed.other);
      } catch {
        toast.error('Failed to load appointment details');
        return;
      }
    } else {
      reset(defaultFormValues);
      setGpRows([emptyGpRow()]);
      setAhpRows([emptyAhpRow()]);
      setSelectedPatient(null);
      setCancelReasons([]);
      setCancelOtherText('');
    }
    setOpen(true);
  };

  const updateGpRow = (key, value) => {
    setGpRows((prev) => prev.map((row) => (row.key === key ? { ...row, gp_id: value } : row)));
  };

  const addGpRow = () => setGpRows((prev) => [...prev, emptyGpRow()]);

  const removeGpRow = (key) => {
    setGpRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
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
    const gpError = validateGpRows(gpRows);
    if (gpError) {
      toast.error(gpError);
      return;
    }

    const ahpError = validateAhpRows(ahpRows);
    if (ahpError) {
      toast.error(ahpError);
      return;
    }

    if (editRow && (formData.status || editRow.status) === 'cancelled') {
      if (!cancelReasons.length) {
        toast.error('Select a cancellation reason');
        return;
      }
      if (cancelReasons.includes('other') && !cancelOtherText.trim()) {
        toast.error('Enter the other cancellation reason');
        return;
      }
    }

    setSubmitting(true);
    try {
      const gpIds = [...new Set(gpRows.filter((r) => r.gp_id).map((r) => Number(r.gp_id)))];
      const assignments = ahpRows
        .filter((r) => r.profession && r.ahp_id)
        .map((r) => ({ profession: r.profession, ahp_id: Number(r.ahp_id) }));

      const patientId = Number(formData.patient_id || selectedPatient?.id);
      if (!patientId) {
        toast.error('Patient is required');
        return;
      }

      const body = {
        patient_id: patientId,
        gp_ids: gpIds,
        title: formData.title?.trim(),
        important_note: formData.important_note || '',
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        patient_previous_records: formData.patient_previous_records || '',
        notes: formData.notes || '',
        ahp_assignments: assignments,
      };

      if (canRecordMeeting) {
        body.record_meeting = Boolean(formData.record_meeting);
      }

      if (editRow) {
        body.status = formData.status || editRow.status;
        if (body.status === 'cancelled') {
          if (!cancelReasons.length) {
            toast.error('Select a cancellation reason');
            return;
          }
          if (cancelReasons.includes('other') && !cancelOtherText.trim()) {
            toast.error('Enter the other cancellation reason');
            return;
          }
          body.cancelled_reason = buildCancelledReason(cancelReasons, cancelOtherText);
        } else {
          body.cancelled_reason = '';
        }
      }

      if (selectedFiles.length > 0) {
        const payload = new FormData();
        Object.entries(body).forEach(([key, val]) => {
          const isList = key === 'ahp_assignments' || key === 'gp_ids';
          payload.append(key, isList ? JSON.stringify(val) : String(val ?? ''));
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
      reload();
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
      reload();
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
    { field: 'appointment_date', headerName: 'Date', render: (r) => formatCalendarDate(r.appointment_date) },
    { field: 'appointment_time', headerName: 'Time', render: (r) => formatClockTime(r.appointment_time) },
    { field: 'gp_summary', headerName: 'GPs', render: (r) => r.gp_summary || r.gp_name || '—' },
    { field: 'assigned_by_name', headerName: 'Assigned By', render: (r) => r.assigned_by_name || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const appointmentFilters = [
    {
      key: 'date_scope',
      label: 'Date',
      value: dateScopeFilter,
      onChange: (v) => { setDateScopeFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All' },
        { value: 'today', label: 'Today' },
        { value: 'tomorrow', label: 'Tomorrow' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'year', label: 'Year' },
      ],
    },
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
    {
      key: 'gp',
      label: 'GP',
      value: gpFilter,
      onChange: (v) => { setGpFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All GPs' },
        ...gpOptions.map((opt) => ({ value: opt.value, label: opt.label })),
      ],
    },
    {
      key: 'assigned_by',
      label: 'Assigned By',
      value: assignedByFilter,
      onChange: (v) => { setAssignedByFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Assigned By' },
        ...assigners.map((user) => ({ value: String(user.id), label: user.name || `User ${user.id}` })),
      ],
    },
  ];

  return (
    <>
      {highlightAppointmentId && (
        <Alert
          severity="info"
          onClose={() => setHighlightAppointmentId(null)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {`Linked appointment ${highlightLabel} is highlighted below. Update status with Edit, open View for details, or Delete if needed.`}
        </Alert>
      )}

      <DataTable
        title="Appointment Records"
        columns={columns}
        rows={rows}
        loading={loading}
        loadingMore={loadingMore}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
          if (highlightAppointmentId) setHighlightAppointmentId(null);
        }}
        searchValue={search}
        searchPlaceholder="Search by patient, ID, or notes..."
        filters={appointmentFilters}
        actionLabel={canCreate ? 'Book Appointment' : undefined}
        onAction={canCreate ? () => handleOpen() : undefined}
        onView={handleView}
        onEdit={canEdit ? handleOpen : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        highlightRowId={highlightAppointmentId}
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
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={dialogContentSx}>
            <SectionCard title="Patient" icon={PersonOutlined}>
              <Grid size={{ xs: 12 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ alignItems: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <PatientSearchField
                      control={control}
                      error={!!errors.patient_id}
                      helperText={errors.patient_id?.message}
                      selectedPatient={selectedPatient}
                      onSelectedPatient={setSelectedPatient}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 210 },
                      height: 44,
                      minHeight: 44,
                      maxHeight: 44,
                      px: 2,
                      flexShrink: 0,
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary' }}>
                      Patient ID
                    </Typography>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 800, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {selectedPatient?.patient_code || '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </SectionCard>

            <SectionCard title="General Practitioners (GP)" icon={MedicalServicesOutlined}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, gridColumn: '1 / -1' }}>
                Assign any number of GPs to this appointment. Click + to add another GP. The same GP
                cannot be added twice.
              </Typography>
              {gpRows.map((row, index) => (
                <Grid size={{ xs: 12 }} key={row.key}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <IconField
                        label={`General Practitioner ${index + 1}`}
                        select
                        icon={MedicalServicesOutlined}
                        value={row.gp_id !== '' && row.gp_id != null ? String(row.gp_id) : ''}
                        onChange={(value) => updateGpRow(row.key, value?.target?.value ?? value)}
                        showSelectPlaceholder
                        required={index === 0}
                        helperText={!gpOptions.length ? 'No active GP found' : undefined}
                        options={gpOptions.filter((opt) => (
                          opt.value === String(row.gp_id)
                          || !gpRows.some((other) => other.key !== row.key && String(other.gp_id) === opt.value)
                        ))}
                      />
                    </Box>
                    <Stack direction="row" spacing={0.5} sx={{ pt: { sm: 0.5 }, flexShrink: 0 }}>
                      <IconButton
                        color="primary"
                        onClick={addGpRow}
                        aria-label="Add another GP"
                        sx={{
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                          '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                        }}
                      >
                        <AddOutlined fontSize="small" />
                      </IconButton>
                      {gpRows.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeGpRow(row.key)}
                          aria-label="Remove GP row"
                        >
                          <DeleteOutlined fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </Grid>
              ))}
            </SectionCard>

            <SectionCard title="Allied Health Professionals (AHP)" icon={HealthAndSafetyOutlined}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, gridColumn: '1 / -1' }}>
                Select a profession, then choose an AHP. Click + to add another profession and AHP.
                The same AHP cannot be added twice.
              </Typography>
              {ahpRows.map((row, index) => {
                const ahpOptions = getAhpsForProfession(row.profession).filter((ahp) => (
                  String(ahp.id) === String(row.ahp_id)
                  || !ahpRows.some((other) => other.key !== row.key && String(other.ahp_id) === String(ahp.id))
                ));
                return (
                  <Grid size={{ xs: 12 }} key={row.key}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <IconField
                          label={`Profession ${index + 1}`}
                          select
                          icon={HealthAndSafetyOutlined}
                          value={row.profession ?? ''}
                          onChange={(value) => updateAhpRow(row.key, 'profession', value?.target?.value ?? value)}
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
                          onChange={(value) => updateAhpRow(row.key, 'ahp_id', value?.target?.value ?? value)}
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
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Conference Note"
                  name="important_note"
                  icon={NotesOutlined}
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
              {canRecordMeeting && (
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="record_meeting"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={(
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        )}
                        label="Record this meeting (full audio and video from start to end)"
                        sx={{ ml: 0.5, '& .MuiFormControlLabel-label': { fontWeight: 600, fontSize: '0.9rem' } }}
                      />
                    )}
                  />
                </Grid>
              )}
            </SectionCard>

            <SectionCard title="More Details — Patient Previous Records" icon={DescriptionOutlined}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={2}>
                  <IconField
                    label="Previous Records (Text)"
                    name="patient_previous_records"
                    multiline
                    rows={4}
                    icon={DescriptionOutlined}
                    register={register}
                  />
                  <IconField
                    label="Internal Notes"
                    name="notes"
                    multiline
                    rows={4}
                    icon={NotesOutlined}
                    register={register}
                  />
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FileDropZone
                  selectedFiles={selectedFiles}
                  onAddFiles={(files) => setSelectedFiles((prev) => [...prev, ...files])}
                  onRemoveSelected={(idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                >
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
                              onClick={() => openAppointmentFilePreview(editRow.id, file.id)}
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
                </FileDropZone>
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
                  {statusValue === 'cancelled' && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: (theme) => alpha(theme.palette.error.main, 0.22),
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        Cancellation reason
                      </Typography>
                      <Stack>
                        {CANCEL_REASON_OPTIONS.map((opt) => (
                          <FormControlLabel
                            key={opt.key}
                            control={
                              <Checkbox
                                size="small"
                                checked={cancelReasons.includes(opt.key)}
                                onChange={(e) => {
                                  setCancelReasons((prev) => (
                                    e.target.checked
                                      ? [...prev, opt.key]
                                      : prev.filter((key) => key !== opt.key)
                                  ));
                                  if (!e.target.checked && opt.key === 'other') setCancelOtherText('');
                                }}
                              />
                            }
                            label={<Typography variant="body2">{opt.label}</Typography>}
                          />
                        ))}
                      </Stack>
                      {cancelReasons.includes('other') && (
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          size="small"
                          label="Other reason"
                          placeholder="Type why this appointment was cancelled"
                          value={cancelOtherText}
                          onChange={(e) => setCancelOtherText(e.target.value)}
                          sx={{ mt: 1, ...fieldSx }}
                        />
                      )}
                    </Box>
                  )}
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
          subtitle="Patient, care team, schedule, and linked teleconference"
        />
        <DialogContent dividers sx={dialogContentSx}>
          {viewLoading ? (
            <Typography color="text.secondary" py={4} textAlign="center">Loading details...</Typography>
          ) : viewData ? (
            <>
              <Box
                sx={{
                  mb: 2.5,
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}
                    >
                      Appointment
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        lineHeight: 1.2,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        letterSpacing: '0.02em',
                        wordBreak: 'break-word',
                      }}
                    >
                      {viewData.appointment_code || `#${viewData.id}`}
                    </Typography>
                    {viewData.title && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {viewData.title}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={formatLabel(viewData.status)}
                    color={STATUS_COLORS[viewData.status] || 'default'}
                    sx={{ fontWeight: 700, flexShrink: 0 }}
                  />
                </Stack>
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 1.25,
                  }}
                >
                  <InfoTile
                    icon={CalendarTodayOutlined}
                    label="Date"
                    value={formatCalendarDate(viewData.appointment_date)}
                  />
                  <InfoTile
                    icon={ScheduleOutlined}
                    label="Time"
                    value={formatClockTime(viewData.appointment_time)}
                  />
                  <InfoTile
                    icon={BadgeOutlined}
                    label="Patient ID"
                    value={viewData.patient_code}
                    mono
                  />
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 0.5 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ViewTopicCard
                    tone="primary"
                    icon={PersonOutlined}
                    title="Registered Patient"
                    hint="Who this appointment is booked for"
                  >
                    <DetailItem icon={PersonOutlined} label="Full Name" value={viewData.patient_name} span={12} />
                    <DetailItem icon={BadgeOutlined} label="Patient ID" value={viewData.patient_code} span={12} mono />
                    <DetailItem
                      icon={CakeOutlined}
                      label="Age"
                      value={patientAgeLabel(viewData.patient_dob)}
                      span={12}
                    />
                  </ViewTopicCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ViewTopicCard
                    tone="secondary"
                    icon={MedicalServicesOutlined}
                    title="Assigned Clinicians"
                    hint="GP and allied health booked for this visit"
                  >
                    <DetailItem
                      icon={MedicalServicesOutlined}
                      label="General Practitioners"
                      value={viewData.gp_summary || viewData.gp_name}
                      span={12}
                    />
                    <DetailItem
                      icon={HealthAndSafetyOutlined}
                      label="Allied Health"
                      value={viewData.ahp_summary}
                      span={12}
                    />
                    <DetailItem
                      icon={GroupOutlined}
                      label="Guest names"
                      value={viewData.guest_summary}
                      span={12}
                    />
                  </ViewTopicCard>
                </Grid>
              </Grid>

              <ViewTopicCard
                tone="info"
                icon={VideoCallOutlined}
                title="Teleconference Session"
                hint="Meeting created from this appointment"
              >
                {viewData.conference ? (
                  <>
                    <DetailItem
                      icon={VideoCallOutlined}
                      label="Conference ID"
                      value={viewData.conference.conference_code}
                      mono
                    />
                    <DetailItem
                      icon={InfoOutlined}
                      label="Conference Status"
                      value={formatLabel(viewData.conference.status)}
                    />
                    <DetailItem
                      icon={CalendarTodayOutlined}
                      label="Scheduled Date"
                      value={formatCalendarDate(viewData.conference.scheduled_date)}
                    />
                    <DetailItem
                      icon={ScheduleOutlined}
                      label="Scheduled Time"
                      value={formatClockTime(viewData.conference.scheduled_time)}
                    />
                    <DetailItem
                      icon={CheckCircleOutlined}
                      label="Opened At"
                      value={viewData.conference.accepted_at
                        ? formatDateTime(viewData.conference.accepted_at)
                        : 'Not opened by reception yet'}
                    />
                    <DetailItem
                      icon={PersonOutlined}
                      label="Assigned by"
                      value={viewData.assigned_by_name}
                    />
                    <DetailItem
                      icon={viewData.record_meeting || viewData.conference?.record_meeting ? VideocamOutlined : VideocamOffOutlined}
                      label="Record meeting"
                      value={viewData.record_meeting || viewData.conference?.record_meeting ? 'Yes — full audio and video' : 'No'}
                    />
                    {viewData.conference.cancelled_reason && (
                      <NotePanel
                        icon={WarningAmberOutlined}
                        label="Conference Cancelled"
                        value={viewData.conference.cancelled_at
                          ? `${viewData.conference.cancelled_reason} — ${formatDateTime(viewData.conference.cancelled_at)}`
                          : viewData.conference.cancelled_reason}
                        tone="error"
                      />
                    )}
                  </>
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Typography color="text.secondary">
                      No linked conference found for this appointment.
                    </Typography>
                  </Grid>
                )}
                {viewData.cancelled_reason && (
                  <NotePanel
                    icon={WarningAmberOutlined}
                    label="Cancellation Reason"
                    value={viewData.cancelled_reason}
                    tone="error"
                  />
                )}
                {String(viewData.important_note || '').trim() && (
                  <NotePanel
                    icon={NotesOutlined}
                    label="Conference Note"
                    value={viewData.important_note}
                  />
                )}
                {String(viewData.patient_previous_records || '').trim() && (
                  <NotePanel
                    icon={DescriptionOutlined}
                    label="Patient Previous Records"
                    value={viewData.patient_previous_records}
                  />
                )}
                {String(viewData.notes || '').trim() && (
                  <NotePanel icon={NotesOutlined} label="Internal Notes" value={viewData.notes} />
                )}
                {viewData.files?.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                      }}
                    >
                      Attach Files
                    </Typography>
                    <Stack spacing={1}>
                      {viewData.files.map((file) => (
                        <Stack
                          key={file.id}
                          direction="row"
                          spacing={1.5}
                          sx={{
                            alignItems: 'center',
                            p: 1.25,
                            borderRadius: '12px',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.default',
                          }}
                        >
                          <InsertDriveFileOutlined sx={{ fontSize: 20, color: 'primary.main', flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                              {file.original_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openAppointmentFilePreview(viewData.id, file.id)}
                            sx={{ flexShrink: 0 }}
                          >
                            Open
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </ViewTopicCard>
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
