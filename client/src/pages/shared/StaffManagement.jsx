import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField,
  Grid, MenuItem, Box, Typography, Stack, Alert, Avatar, Chip, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PersonAddOutlined, PersonOutlined, EmailOutlined, PhoneOutlined, LockOutlined,
  MedicalServicesOutlined, HealthAndSafetyOutlined, BadgeOutlined, LocalHospitalOutlined,
  EventOutlined, ToggleOnOutlined, CalendarTodayOutlined, LocationOnOutlined,
  WcOutlined, ContactEmergencyOutlined,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx,
  handleFormDialogClose, selectMenuSlotProps,
} from '../../components/PremiumFormFields';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { WEEKDAYS, parseWeekdays, formatWeekdays, formatWeekdayInitials, formatWeekdayShort, WEEKDAY_SELECT_PLACEHOLDER } from '../../utils/constants';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import {
  staffCreateSchema, staffEditSchema, staffPasswordResetSchema,
  receptionistCreateSchema, receptionistEditSchema,
} from '../../utils/formSchemas';

const EXTRA_FIELD_ICONS = {
  specialization: MedicalServicesOutlined,
  profession: HealthAndSafetyOutlined,
  registration_number: BadgeOutlined,
  hospital: LocalHospitalOutlined,
  availability: EventOutlined,
};

const PROFILE_FIELD_ICONS = {
  date_of_birth: CalendarTodayOutlined,
  gender: WcOutlined,
  nic: BadgeOutlined,
  address: LocationOnOutlined,
  emergency_contact: ContactEmergencyOutlined,
};

const formatDobInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const formatGenderLabel = (value) => {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const DetailRow = ({ icon: Icon, label, value, size = { xs: 12, sm: 6 } }) => (
  <Grid size={size}>
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
        {Icon && (
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
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 17 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 600,
              mb: 0.35,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {value || '—'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  </Grid>
);

const ViewSection = ({ title, icon: Icon, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.75 }}>
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
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Stack>
    <Grid container spacing={1.5}>{children}</Grid>
  </Box>
);

const StaffViewDialog = ({
  open,
  row,
  onClose,
  singular,
  codeField,
  codeLabel,
  extraFields,
  profileFields = [],
  headerIcon: HeaderIcon,
}) => {
  const { formatDate } = useSystemDateTime();
  if (!row) return null;

  const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
  const initials = fullName
    ? fullName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
    : '?';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { ...dialogPaperSx, maxHeight: '92vh' } } }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          flexShrink: 0,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.light} 100%)`,
          color: 'common.white',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              fontWeight: 700,
              bgcolor: alpha('#FFFFFF', 0.18),
              border: '2px solid',
              borderColor: alpha('#FFFFFF', 0.35),
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {fullName || singular}
            </Typography>
            {row[codeField] && (
              <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.85 }}>
                {row[codeField]}
              </Typography>
            )}
          </Box>
          {row.status && (
            <Chip
              label={row.status}
              size="small"
              sx={{
                bgcolor: alpha('#FFFFFF', 0.14),
                color: 'common.white',
                fontWeight: 600,
                border: '1px solid',
                borderColor: alpha('#FFFFFF', 0.2),
                textTransform: 'capitalize',
              }}
            />
          )}
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5, overflowY: 'auto', bgcolor: 'background.default' }}>
        <ViewSection title="Account Information" icon={PersonOutlined}>
          <DetailRow icon={BadgeOutlined} label={codeLabel} value={row[codeField]} />
          <DetailRow icon={PersonOutlined} label="Full Name" value={fullName} />
          <DetailRow icon={EmailOutlined} label="Email Address" value={row.email} />
          <DetailRow icon={PhoneOutlined} label="Phone Number" value={row.phone} />
          <DetailRow
            icon={ToggleOnOutlined}
            label="Status"
            value={row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : '—'}
          />
        </ViewSection>

        {profileFields.length > 0 && (
          <ViewSection title="Personal Details" icon={PersonOutlined}>
            {profileFields.map((f) => {
              let value = row[f.name];
              if (f.name === 'date_of_birth') value = formatDate(row.date_of_birth);
              if (f.name === 'gender') value = formatGenderLabel(row.gender);
              if (f.weekdaySelect) value = formatWeekdays(parseWeekdays(row[f.name]));
              return (
                <DetailRow
                  key={f.name}
                  icon={PROFILE_FIELD_ICONS[f.name]}
                  label={f.label}
                  value={value}
                  size={f.multiline ? { xs: 12 } : { xs: 12, sm: 6 }}
                />
              );
            })}
          </ViewSection>
        )}

        {extraFields.length > 0 && (
          <ViewSection
            title="Professional Details"
            icon={HeaderIcon || MedicalServicesOutlined}
          >
            {extraFields.map((f) => {
              let value = row[f.name];
              if (f.weekdaySelect) value = formatWeekdays(parseWeekdays(row[f.name]));
              return (
                <DetailRow
                  key={f.name}
                  icon={EXTRA_FIELD_ICONS[f.name]}
                  label={f.label}
                  value={value}
                  size={f.multiline || f.weekdaySelect ? { xs: 12 } : { xs: 12, sm: 6 }}
                />
              );
            })}
          </ViewSection>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" sx={{ px: 3, borderRadius: 2, fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const createStaffPage = ({
  title,
  subtitle,
  endpoint,
  codeField,
  codeLabel = 'ID',
  extraFields = [],
  profileFields = [],
  hidePhoneColumn = false,
  showCreatedDate = false,
  allowDeactivate = true,
  deleteConfirmTitle,
  deleteConfirmMessage,
  deleteConfirmLabel,
  createSchema = staffCreateSchema,
  editSchema = staffEditSchema,
  createSuccessMessage,
  enablePasswordReset = false,
  enableView = false,
  viewHeaderIcon,
  fieldOptionsEndpoint = null,
  requiredFields = ['name', 'email'],
}) => {
  const StaffPage = () => {
    const { formatDate } = useSystemDateTime();
    const [rows, setRows] = useState([]);
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
    const [resetOpen, setResetOpen] = useState(false);
    const [resetTarget, setResetTarget] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewRow, setViewRow] = useState(null);
    const [selectOptions, setSelectOptions] = useState({});

    const schema = editRow ? editSchema : createSchema;
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
      resolver: yupResolver(schema),
    });

    const resetPasswordForm = useForm({
      resolver: yupResolver(staffPasswordResetSchema),
      defaultValues: { password: '', confirmPassword: '' },
    });

    const singular = title.replace(/s$/, '');

    const isFieldRequired = (fieldName) => {
      if (requiredFields.includes(fieldName)) return true;
      if (!editRow && (fieldName === 'password' || fieldName === 'confirmPassword')) return true;
      if (editRow && fieldName === 'status') return true;
      return false;
    };

    const getStaffSubject = (row) => {
      if (!row) return '';
      const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
      const code = row[codeField];
      if (name && code) return `${name} · ${code}`;
      return name || code || row.email || singular;
    };

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(endpoint, {
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
        toast.error(`Failed to load ${title.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    }, [search, statusFilter, page, rowsPerPage]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
      if (!fieldOptionsEndpoint) return undefined;
      api.get(fieldOptionsEndpoint)
        .then(({ data }) => {
          const options = (data.data ?? []).map((item) => ({
            value: item.name,
            label: item.name,
          }));
          const fieldName = extraFields.find((f) => f.select)?.name;
          if (fieldName) {
            setSelectOptions((prev) => ({ ...prev, [fieldName]: options }));
          }
        })
        .catch(() => {});
      return undefined;
    }, [fieldOptionsEndpoint]);

    const handleOpen = (row = null) => {
      setEditRow(row);
      const defaults = {
        name: '', email: '', phone: '', password: '', confirmPassword: '', status: 'active',
      };
      extraFields.forEach((f) => { defaults[f.name] = f.weekdaySelect ? [] : ''; });
      profileFields.forEach((f) => { defaults[f.name] = ''; });
      if (row) {
        defaults.name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        defaults.email = row.email;
        defaults.phone = row.phone || '';
        defaults.status = row.status;
      extraFields.forEach((f) => {
        defaults[f.name] = f.weekdaySelect
          ? parseWeekdays(row[f.name])
          : row[f.name] || '';
      });
      profileFields.forEach((f) => {
        defaults[f.name] = f.name === 'date_of_birth'
          ? formatDobInput(row[f.name])
          : row[f.name] || '';
      });
      if (row.profession && fieldOptionsEndpoint) {
        setSelectOptions((prev) => {
          const opts = prev.profession || [];
          if (opts.some((o) => o.value === row.profession)) return prev;
          return { ...prev, profession: [...opts, { value: row.profession, label: row.profession }] };
        });
      }
    }
      reset(defaults);
      setOpen(true);
    };

    const onInvalid = (formErrors) => {
      const firstError = Object.values(formErrors).find((e) => e?.message);
      toast.error(firstError?.message || 'Please fix the highlighted fields');
    };

    const onSubmit = async (formData) => {
      setSubmitting(true);
      try {
        const payload = { ...formData };
        delete payload.confirmPassword;
        extraFields.forEach((f) => {
          if (f.weekdaySelect && Array.isArray(payload[f.name])) {
            payload[f.name] = payload[f.name].length ? payload[f.name].join(', ') : '';
          }
        });
        if (editRow) {
          await api.put(`${endpoint}/${editRow.id}`, payload);
          toast.success(`${singular} updated successfully`);
        } else {
          await api.post(endpoint, payload);
          toast.success(
            createSuccessMessage || `${singular} created successfully`,
            { autoClose: 6000 }
          );
        }
        setOpen(false);
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

    const handleDeleteRequest = (row) => {
      setPendingDelete(row);
      setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
      if (!pendingDelete) return;
      setSubmitting(true);
      try {
        if (allowDeactivate) {
          await api.put(`${endpoint}/${pendingDelete.id}`, { status: 'inactive' });
          toast.success(`${singular} deactivated successfully`);
        } else {
          await api.delete(`${endpoint}/${pendingDelete.id}`);
          toast.success(`${singular} deleted successfully`);
        }
        setConfirmOpen(false);
        setPendingDelete(null);
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Operation failed');
      } finally {
        setSubmitting(false);
      }
    };

    const openResetDialog = (row) => {
      setResetTarget(row);
      resetPasswordForm.reset({ password: '', confirmPassword: '' });
      setResetOpen(true);
    };

    const handleResetPassword = async (formData) => {
      if (!resetTarget) return;
      setSubmitting(true);
      try {
        await api.patch(`${endpoint}/${resetTarget.id}/password`, { password: formData.password });
        toast.success('Receptionist password updated successfully.');
        setResetOpen(false);
        setResetTarget(null);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Password reset failed');
      } finally {
        setSubmitting(false);
      }
    };

    const handleView = (row) => {
      setViewRow(row);
      setViewOpen(true);
    };

    const columns = [
      { field: codeField, headerName: codeLabel },
      { field: 'first_name', headerName: 'Name', render: (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—' },
      { field: 'email', headerName: 'Email' },
      ...(hidePhoneColumn ? [] : [{ field: 'phone', headerName: 'Phone', render: (r) => r.phone || '—' }]),
      ...extraFields
        .filter((f) => !f.hideInTable)
        .map((f) => ({
          field: f.name,
          headerName: f.label,
          render: (r) => {
            if (f.weekdaySelect) return formatWeekdayInitials(r[f.name]);
            return r[f.name] || '—';
          },
        })),
      { field: 'status', headerName: 'Status', type: 'status' },
      ...(showCreatedDate ? [{
        field: 'created_at',
        headerName: 'Created Date',
        render: (r) => formatDate(r.created_at),
      }] : []),
    ];

    const staffFilters = [
      {
        key: 'status',
        label: 'Status',
        value: statusFilter,
        onChange: (v) => { setStatusFilter(v); setPage(0); },
        options: [
          { value: '', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'disabled', label: 'Disabled' },
        ],
      },
    ];

    const recordsTitle = title === 'General Practitioners'
      ? 'GP Records'
      : title === 'Allied Health Professionals'
        ? 'AHP Records'
        : `${title} Records`;

    return (
      <>
        <DataTable
          title={recordsTitle}
          columns={columns}
          rows={rows}
          loading={loading}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder={`Search ${title.toLowerCase()} by name, email, or ID...`}
          filters={staffFilters}
          actionLabel={`Add ${singular}`}
          onAction={() => handleOpen()}
          actionIcon={PersonAddOutlined}
          onEdit={handleOpen}
          onView={enableView ? handleView : undefined}
          onDelete={handleDeleteRequest}
          onResetPassword={enablePasswordReset ? openResetDialog : undefined}
          actions
        />

        <Dialog
          open={open}
          onClose={handleFormDialogClose(() => setOpen(false), submitting)}
          maxWidth="md"
          fullWidth
          scroll="paper"
          slotProps={{ paper: { sx: dialogPaperSx } }}
        >
          <PremiumDialogHeader
            icon={PersonAddOutlined}
            title={editRow ? `Edit ${singular}` : `Add ${singular}`}
            subtitle={editRow
              ? 'Update account details and professional information'
              : 'Set login credentials and profile details for this staff member'}
          />
          <Box
            key={editRow?.id ?? 'new'}
            component="form"
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            <DialogContent dividers sx={dialogContentSx}>
              {!editRow && enablePasswordReset && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  The password you enter here is what the receptionist will use to log in. It is stored securely and cannot be viewed later.
                </Alert>
              )}

              <SectionCard title="Account Information" icon={PersonOutlined}>
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Full Name"
                    name="name"
                    icon={PersonOutlined}
                    register={register}
                    required={isFieldRequired('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Email Address"
                    name="email"
                    type="email"
                    icon={EmailOutlined}
                    register={register}
                    required={isFieldRequired('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Phone Number"
                    name="phone"
                    icon={PhoneOutlined}
                    register={register}
                    required={isFieldRequired('phone')}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                </Grid>
                {!editRow && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <IconField
                        label="Password"
                        name="password"
                        type="password"
                        icon={LockOutlined}
                        register={register}
                        required={isFieldRequired('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message || 'Minimum 8 characters — used for login'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <IconField
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        icon={LockOutlined}
                        register={register}
                        required={isFieldRequired('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                      />
                    </Grid>
                  </>
                )}
              </SectionCard>

              {profileFields.length > 0 && (
                <SectionCard title="Personal Details" icon={PersonOutlined}>
                  {profileFields.map((f) => (
                    <Grid size={{ xs: 12, sm: f.multiline ? 12 : 6 }} key={f.name}>
                        <IconField
                          label={f.label}
                          name={f.name}
                          type={f.type}
                          icon={PROFILE_FIELD_ICONS[f.name]}
                          register={register}
                          control={control}
                          select={f.select}
                          options={f.options}
                        multiline={f.multiline}
                        rows={f.multiline ? 3 : 1}
                        required={Boolean(f.required)}
                        error={!!errors[f.name]}
                        helperText={errors[f.name]?.message}
                      />
                    </Grid>
                  ))}
                </SectionCard>
              )}

              {extraFields.length > 0 && (
                <SectionCard
                  title="Professional Details"
                  icon={title.includes('Practitioner') ? MedicalServicesOutlined : HealthAndSafetyOutlined}
                >
                  {extraFields.map((f) => (
                    <Grid size={{ xs: 12 }} key={f.name}>
                      {f.weekdaySelect ? (
                        <Controller
                          name={f.name}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              value={field.value || []}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(typeof val === 'string' ? val.split(',') : val);
                              }}
                              fullWidth
                              size="small"
                              select
                              label={f.label}
                              sx={fieldSx}
                              slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start" sx={{ ml: 0.5 }}>
                                      <EventOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                                    </InputAdornment>
                                  ),
                                },
                                select: {
                                  multiple: true,
                                  MenuProps: selectMenuSlotProps,
                                  renderValue: (selected) => {
                                    if (!selected.length) {
                                      return (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 0.25 }}>
                                          {WEEKDAY_SELECT_PLACEHOLDER}
                                        </Typography>
                                      );
                                    }
                                    return (
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.25 }}>
                                        {selected.map((day) => (
                                          <Chip
                                            key={day}
                                            label={formatWeekdayShort(day)}
                                            size="small"
                                            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }}
                                          />
                                        ))}
                                      </Box>
                                    );
                                  },
                                },
                              }}
                            >
                              {WEEKDAYS.map((day) => (
                                <MenuItem key={day} value={day}>{day}</MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      ) : (
                        <IconField
                          label={f.label}
                          name={f.name}
                          icon={EXTRA_FIELD_ICONS[f.name]}
                          register={register}
                          control={control}
                          select={f.select}
                          options={f.select ? selectOptions[f.name] : undefined}
                          helperText={
                            f.select && !(selectOptions[f.name]?.length)
                              ? 'Add professions in Preferences first'
                              : undefined
                          }
                          multiline={f.multiline}
                          rows={f.multiline ? 2 : 1}
                          required={Boolean(f.required)}
                        />
                      )}
                    </Grid>
                  ))}
                </SectionCard>
              )}

              <SectionCard title="Account Status" icon={ToggleOnOutlined}>
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Status"
                    name="status"
                    select
                    icon={ToggleOnOutlined}
                    control={control}
                    showSelectPlaceholder={false}
                    required={isFieldRequired('status')}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    {editRow && <MenuItem value="disabled">Disabled</MenuItem>}
                  </IconField>
                </Grid>
              </SectionCard>
            </DialogContent>
            <FormDialogActions
              onCancel={() => setOpen(false)}
              submitLabel={submitting ? 'Saving...' : editRow ? 'Save Changes' : `Create ${singular}`}
              loading={submitting}
            />
          </Box>
        </Dialog>

        {enablePasswordReset && (
          <Dialog open={resetOpen} onClose={handleFormDialogClose(() => setResetOpen(false), submitting)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Reset Receptionist Password</DialogTitle>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set a new password for <strong>{resetTarget?.email}</strong>. Existing passwords cannot be retrieved.
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth label="New Password" type="password" required
                    placeholder={getFieldPlaceholder('newPassword', { type: 'password' })}
                    {...resetPasswordForm.register('password')}
                    error={!!resetPasswordForm.formState.errors.password}
                    helperText={resetPasswordForm.formState.errors.password?.message}
                  />
                  <TextField
                    fullWidth label="Confirm Password" type="password" required
                    placeholder={getFieldPlaceholder('confirmPassword', { type: 'password' })}
                    {...resetPasswordForm.register('confirmPassword')}
                    error={!!resetPasswordForm.formState.errors.confirmPassword}
                    helperText={resetPasswordForm.formState.errors.confirmPassword?.message}
                  />
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setResetOpen(false)} color="inherit" disabled={submitting}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Reset Password'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        )}

        <ConfirmDialog
          open={confirmOpen}
          title={deleteConfirmTitle || (allowDeactivate ? `Deactivate ${singular}` : `Delete ${singular}`)}
          subject={getStaffSubject(pendingDelete)}
          message={
            deleteConfirmMessage
            || (allowDeactivate
              ? `Are you sure you want to deactivate this ${singular.toLowerCase()}? They will no longer be able to log in.`
              : `Are you sure you want to permanently delete this ${singular.toLowerCase()}? This action cannot be undone.`)
          }
          confirmLabel={deleteConfirmLabel || (allowDeactivate ? 'Deactivate' : 'Delete')}
          loading={submitting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
        />

        {enableView && (
          <StaffViewDialog
            open={viewOpen}
            row={viewRow}
            onClose={() => { setViewOpen(false); setViewRow(null); }}
            singular={singular}
            codeField={codeField}
            codeLabel={codeLabel}
            extraFields={extraFields}
            profileFields={profileFields}
            headerIcon={viewHeaderIcon}
          />
        )}
      </>
    );
  };
  return StaffPage;
};

export const Receptionists = createStaffPage({
  title: 'Receptionists',
  subtitle: 'Create receptionist accounts with login passwords. Receptionists sign in on the same login page as all other roles.',
  endpoint: '/staff/receptionists',
  codeField: 'receptionist_code',
  codeLabel: 'ID',
  requiredFields: ['name', 'email', 'phone'],
  showCreatedDate: true,
  allowDeactivate: false,
  enableView: true,
  viewHeaderIcon: PersonOutlined,
  profileFields: [
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    {
      name: 'gender',
      label: 'Gender',
      select: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
    { name: 'address', label: 'Address', multiline: true },
    { name: 'nic', label: 'National ID (NIC)' },
    { name: 'emergency_contact', label: 'Emergency Contact' },
  ],
  deleteConfirmTitle: 'Delete Receptionist',
  deleteConfirmMessage: 'Are you sure you want to permanently remove this receptionist account? They will no longer be able to log in and all access will be revoked immediately.',
  deleteConfirmLabel: 'Delete',
  createSchema: receptionistCreateSchema,
  editSchema: receptionistEditSchema,
  enablePasswordReset: true,
  createSuccessMessage: 'Receptionist created successfully. Use the email and password you entered to log in.',
});

export const GPs = createStaffPage({
  title: 'General Practitioners',
  subtitle: 'Manage GP accounts',
  endpoint: '/staff/gps',
  codeField: 'gp_code',
  codeLabel: 'ID',
  hidePhoneColumn: true,
  enableView: true,
  viewHeaderIcon: MedicalServicesOutlined,
  extraFields: [
    { name: 'specialization', label: 'Specialization' },
    { name: 'registration_number', label: 'Registration Number', hideInTable: true },
    { name: 'hospital', label: 'Practice Address', hideInTable: true },
    { name: 'availability', label: 'Availability', weekdaySelect: true },
  ],
});

export const AHPs = createStaffPage({
  title: 'Allied Health Professionals',
  subtitle: 'Manage AHP accounts',
  endpoint: '/staff/ahps',
  codeField: 'ahp_code',
  codeLabel: 'ID',
  enableView: true,
  viewHeaderIcon: HealthAndSafetyOutlined,
  fieldOptionsEndpoint: '/preferences/ahp-professions',
  extraFields: [
    { name: 'profession', label: 'Profession', select: true },
    { name: 'registration_number', label: 'Registration Number', hideInTable: true },
    { name: 'availability', label: 'Availability', weekdaySelect: true },
  ],
});
