import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogTitle, DialogActions, Button, TextField,
  Grid, Box, Typography, Stack, Avatar, Chip, Tooltip, IconButton,
  Switch,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PersonAddOutlined, PersonOutlined, EmailOutlined, PhoneOutlined, LockOutlined,
  MedicalServicesOutlined, HealthAndSafetyOutlined, BadgeOutlined, LocalHospitalOutlined,
  EventOutlined, ToggleOnOutlined, CalendarTodayOutlined, LocationOnOutlined,
  WcOutlined, ContactEmergencyOutlined, AddOutlined, DeleteOutlined,
  VerifiedUserOutlined, CheckCircleOutlined, CancelOutlined, EditOutlined,
  VideoCallOutlined, CallEndOutlined, VisibilityOutlined, DownloadOutlined, AssessmentOutlined,
  TaskAltOutlined, VideocamOutlined,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx,
  handleFormDialogClose,
} from '../../components/PremiumFormFields';
import PasswordTextField from '../../components/PasswordReveal';
import AccountStatusToggle from '../../components/AccountStatusToggle';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import useRolePermissions from '../../hooks/useRolePermissions';
import { usePageRefreshRegister } from '../../context/PageRefreshContext';
import useProgressiveTable from '../../hooks/useProgressiveTable';
import { WEEKDAYS, parseWeekdays, formatWeekdays, formatWeekdayInitials, ROLES } from '../../utils/constants';
import { getFieldPlaceholder } from '../../utils/fieldPlaceholders';
import {
  staffCreateSchema, staffEditSchema, staffPasswordResetSchema,
  receptionistCreateSchema, receptionistEditSchema,
  staffUpsertSchema, receptionistUpsertSchema,
} from '../../utils/formSchemas';
import {
  RECEPTIONIST_PERMISSION_GROUPS,
  DEFAULT_RECEPTIONIST_PERMISSIONS,
  normalizeReceptionistPermissions,
} from '../../utils/receptionistPermissions';

const PERMISSION_ICONS = {
  patients_create: AddOutlined,
  patients_edit: EditOutlined,
  patients_delete: DeleteOutlined,
  appointments_create: EventOutlined,
  appointments_edit: EditOutlined,
  appointments_delete: DeleteOutlined,
  tasks_create: AddOutlined,
  tasks_edit: EditOutlined,
  tasks_delete: DeleteOutlined,
  gps_create: MedicalServicesOutlined,
  gps_edit: EditOutlined,
  gps_delete: DeleteOutlined,
  ahps_create: HealthAndSafetyOutlined,
  ahps_edit: EditOutlined,
  ahps_delete: DeleteOutlined,
  conference_open: VideoCallOutlined,
  conference_end: CallEndOutlined,
  conference_record: VideocamOutlined,
  documents_view: VisibilityOutlined,
  documents_download: DownloadOutlined,
  reports_export: AssessmentOutlined,
};

const CONFERENCE_PERMISSION_KEYS = [
  'conference_open',
  'conference_end',
  'conference_record',
  'documents_view',
  'documents_download',
  'reports_export',
];

const PermissionIconBadge = ({ permissionKey, label, allowed }) => {
  const Icon = PERMISSION_ICONS[permissionKey] || VerifiedUserOutlined;
  return (
    <Tooltip title={`${label}: ${allowed ? 'Allow' : 'Not allow'}`}>
      <Box
        sx={{
          position: 'relative',
          width: 28,
          height: 28,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(
            allowed ? theme.palette.success.main : theme.palette.error.main,
            0.1,
          ),
          color: allowed ? 'success.main' : 'error.main',
        }}
      >
        <Icon sx={{ fontSize: 15 }} />
        <Box
          sx={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {allowed
            ? <CheckCircleOutlined sx={{ fontSize: 12, color: 'success.main' }} />
            : <CancelOutlined sx={{ fontSize: 12, color: 'error.main' }} />}
        </Box>
      </Box>
    </Tooltip>
  );
};

const PageOnOffToggle = ({ checked, onChange, disabled = false }) => (
  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
    <Typography
      variant="caption"
      sx={{
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: checked ? 'text.disabled' : 'error.main',
      }}
    >
      OFF
    </Typography>
    <Switch
      size="small"
      color="success"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.checked)}
    />
    <Typography
      variant="caption"
      sx={{
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: checked ? 'success.main' : 'text.disabled',
      }}
    >
      ON
    </Typography>
  </Stack>
);

const ConferencePermissionIcons = ({ permissions }) => {
  const flags = normalizeReceptionistPermissions(permissions);
  const conferenceGroup = RECEPTIONIST_PERMISSION_GROUPS.find((group) => group.title === 'Conferences');
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {(conferenceGroup?.permissions || CONFERENCE_PERMISSION_KEYS.map((key) => ({ key, label: key }))).map(({ key, label }) => (
        <PermissionIconBadge
          key={key}
          permissionKey={key}
          label={label}
          allowed={flags[key] === true}
        />
      ))}
    </Stack>
  );
};

const PERMISSION_GROUP_ICONS = {
  Patients: LocalHospitalOutlined,
  Conferences: VideoCallOutlined,
  Appointments: EventOutlined,
  'Task List': TaskAltOutlined,
  'General Practitioners': MedicalServicesOutlined,
  'Allied Health Professionals': HealthAndSafetyOutlined,
};

const PermissionModuleCard = ({ group, pageOn, toggle, children }) => {
  const Icon = PERMISSION_GROUP_ICONS[group.title] || VerifiedUserOutlined;
  return (
    <Grid size={{ xs: 12, md: group.permissions.length > 3 ? 12 : 6 }}>
      <Box
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          px: 2,
          py: 1.75,
          pl: 2.25,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: (theme) => (pageOn
            ? alpha(theme.palette.success.main, 0.28)
            : theme.palette.divider),
          bgcolor: (theme) => (pageOn
            ? alpha(theme.palette.success.main, 0.04)
            : theme.palette.background.paper),
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.045)',
          opacity: pageOn ? 1 : 0.62,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: pageOn ? 'success.main' : 'divider',
          },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            >
              <Icon sx={{ fontSize: 16 }} />
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'text.primary',
              }}
            >
              {group.title}
            </Typography>
          </Stack>
          <PageOnOffToggle
            checked={pageOn}
            disabled={!toggle}
            onChange={toggle}
          />
        </Stack>
        {children}
      </Box>
    </Grid>
  );
};

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
  showPermissions = false,
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
                bgcolor: row.status === 'inactive'
                  ? alpha('#DC2626', 0.92)
                  : alpha('#FFFFFF', 0.14),
                color: 'common.white',
                fontWeight: 700,
                border: '1px solid',
                borderColor: row.status === 'inactive'
                  ? alpha('#FECACA', 0.55)
                  : alpha('#FFFFFF', 0.2),
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
          {row.created_at && (
            <DetailRow
              icon={CalendarTodayOutlined}
              label="Created Date"
              value={formatDate(row.created_at)}
            />
          )}
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

        {showPermissions && (
          <ViewSection title="Permissions" icon={VerifiedUserOutlined}>
            <Grid size={{ xs: 12 }}>
              <ReceptionistPermissionView permissions={row.permissions} />
            </Grid>
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

const AhpProfessionsDialog = ({ open, onClose, onUpdated }) => {
  const [professions, setProfessions] = useState([]);
  const [newProfession, setNewProfession] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadProfessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/preferences/ahp-professions');
      setProfessions(data.data ?? []);
    } catch {
      toast.error('Failed to load professions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadProfessions();
  }, [open, loadProfessions]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newProfession.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await api.post('/preferences/ahp-professions', { name });
      toast.success('Profession added');
      setNewProfession('');
      await loadProfessions();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add profession');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/preferences/ahp-professions/${pendingDelete.id}`);
      toast.success('Profession removed');
      setPendingDelete(null);
      await loadProfessions();
      onUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove profession');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
        <PremiumDialogHeader
          icon={HealthAndSafetyOutlined}
          title="AHP Professions"
          subtitle="Add or remove allied health profession types used when creating AHP accounts"
        />
        <DialogContent sx={dialogContentSx}>
          <Box component="form" onSubmit={handleAdd}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                label="New profession"
                placeholder="e.g. Physiotherapist"
                value={newProfession}
                onChange={(e) => setNewProfession(e.target.value)}
                disabled={submitting}
                sx={fieldSx}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !newProfession.trim()}
                startIcon={<AddOutlined />}
                sx={{ flexShrink: 0, px: 3, borderRadius: '999px', fontWeight: 700 }}
              >
                Add
              </Button>
            </Stack>
          </Box>
          {loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Loading professions…
            </Typography>
          ) : professions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No professions yet. Add the first one above.
            </Typography>
          ) : (
            <Grid container spacing={1.25}>
              {professions.map((item) => (
                <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 1,
                      minHeight: 48,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, pr: 1 }}>
                      {item.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setPendingDelete(item)}
                      sx={{
                        color: 'error.main',
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.16) },
                      }}
                    >
                      <DeleteOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove Profession"
        message="AHP accounts using this profession will keep their current value, but it will no longer appear in the dropdown for new accounts."
        subject={pendingDelete?.name}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};

const ReceptionistPermissionView = ({ permissions }) => {
  const flags = normalizeReceptionistPermissions(permissions);
  return (
    <Grid container spacing={1.5} sx={{ width: '100%' }}>
      {RECEPTIONIST_PERMISSION_GROUPS.map((group) => {
        const pageOn = flags[group.pageKey] !== false;
        return (
          <PermissionModuleCard key={group.title} group={group} pageOn={pageOn}>
            <Stack direction="row" spacing={1.25} sx={{ flexWrap: 'wrap', rowGap: 1, alignItems: 'center' }}>
              {group.permissions.map((permission) => (
                <Stack
                  key={permission.key}
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center' }}
                >
                  <PermissionIconBadge
                    permissionKey={permission.key}
                    label={permission.label}
                    allowed={flags[permission.key] !== false}
                  />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {permission.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </PermissionModuleCard>
        );
      })}
    </Grid>
  );
};

const ReceptionistPermissionFields = ({ value, onToggle }) => (
  <Grid size={{ xs: 12 }}>
    <Stack spacing={1.5}>
      <Typography variant="caption" color="text.secondary">
        Unchecked actions are blocked for this receptionist.
      </Typography>
      <Grid container spacing={1.5}>
        {RECEPTIONIST_PERMISSION_GROUPS.map((group) => {
          const pageOn = value[group.pageKey] !== false;
          return (
            <PermissionModuleCard
              key={group.title}
              group={group}
              pageOn={pageOn}
              toggle={(granted) => onToggle(group.pageKey, granted)}
            >
              <Stack
                direction="row"
                sx={{
                  flexWrap: 'wrap',
                  gap: 1,
                  opacity: pageOn ? 1 : 0.4,
                  pointerEvents: pageOn ? 'auto' : 'none',
                }}
              >
                {group.permissions.map((permission) => {
                  const checked = value[permission.key] !== false;
                  return (
                    <Chip
                      key={permission.key}
                      clickable
                      size="small"
                      label={permission.label}
                      color={checked ? 'primary' : 'default'}
                      variant={checked ? 'filled' : 'outlined'}
                      onClick={() => onToggle(permission.key, !checked)}
                      sx={{ fontWeight: 700, height: 28 }}
                    />
                  );
                })}
              </Stack>
            </PermissionModuleCard>
          );
        })}
      </Grid>
    </Stack>
  </Grid>
);

const createStaffPage = ({
  title,
  subtitle: _subtitle,
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
  createSchema: _createSchema = staffCreateSchema,
  editSchema: _editSchema = staffEditSchema,
  createSuccessMessage,
  enablePasswordReset = false,
  enableView = false,
  viewHeaderIcon,
  fieldOptionsEndpoint = null,
  requiredFields = ['name', 'email'],
  addButtonLabel = null,
  enableProfessionsManager = false,
  permissionResource = null,
  enableReceptionistPermissions = false,
}) => {
  const StaffPage = () => {
    const { formatDate } = useSystemDateTime();
    const { canCreate, canEdit, canDelete } = useRolePermissions(permissionResource);
    const { user } = useSelector((state) => state.auth);
    const canResetPassword = enablePasswordReset
      && [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    const [specializationOptions, setSpecializationOptions] = useState([]);
    const [professionFilter, setProfessionFilter] = useState('');
    const [professionOptions, setProfessionOptions] = useState([]);
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
    const [professionsOpen, setProfessionsOpen] = useState(false);
    const [permissions, setPermissions] = useState(DEFAULT_RECEPTIONIST_PERMISSIONS);

    const togglePermission = (key, granted) => setPermissions((p) => ({ ...p, [key]: granted }));

    const upsertSchema = endpoint === '/staff/receptionists' ? receptionistUpsertSchema : staffUpsertSchema;
    const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
      resolver: yupResolver(upsertSchema),
      context: { isEdit: Boolean(editRow) },
    });

    const resetPasswordForm = useForm({
      resolver: yupResolver(staffPasswordResetSchema),
      defaultValues: { password: '', confirmPassword: '' },
    });

    const singular = title.replace(/s$/, '');
    const addLabel = addButtonLabel || `Add ${singular}`;

    const reloadFieldOptions = useCallback(() => {
      if (!fieldOptionsEndpoint) return;
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
    }, [fieldOptionsEndpoint, extraFields]);

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

    const fetchStaff = useCallback(async ({ page: pageNum, limit }) => {
      const { data } = await api.get(endpoint, {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          gender: enableReceptionistPermissions ? (genderFilter || undefined) : undefined,
          specialization: extraFields.some((f) => f.name === 'specialization')
            ? (specializationFilter || undefined)
            : undefined,
          profession: extraFields.some((f) => f.name === 'profession')
            ? (professionFilter || undefined)
            : undefined,
          page: pageNum,
          limit,
        },
      });
      if (Array.isArray(data.specializations)) {
        setSpecializationOptions(data.specializations);
      }
      if (Array.isArray(data.professions)) {
        setProfessionOptions(data.professions);
      }
      return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
    }, [search, statusFilter, genderFilter, specializationFilter, professionFilter, enableReceptionistPermissions, extraFields]);

    const {
      rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload, error,
    } = useProgressiveTable(fetchStaff);

    useEffect(() => {
      if (error) toast.error(`Failed to load ${title.toLowerCase()}`);
    }, [error]);

    usePageRefreshRegister(reload);

    useEffect(() => {
      reloadFieldOptions();
    }, [reloadFieldOptions]);

    const handleCloseForm = () => {
      setOpen(false);
      setEditRow(null);
    };

    const handleOpen = (row = null) => {
      setEditRow(row);
      setPermissions(row
        ? normalizeReceptionistPermissions(row.permissions)
        : DEFAULT_RECEPTIONIST_PERMISSIONS);
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
        if (enableReceptionistPermissions) payload.permissions = permissions;
        extraFields.forEach((f) => {
          if (f.weekdaySelect && Array.isArray(payload[f.name])) {
            payload[f.name] = payload[f.name].length ? payload[f.name].join(', ') : '';
          }
        });
        if (editRow) {
          const { data: res } = await api.put(`${endpoint}/${editRow.id}`, payload);
          toast.success(res.message || `${singular} updated successfully`);
          if (res.sessionRevoked) {
            toast.info('The user has been signed out from all active sessions.', { autoClose: 5000 });
          }
        } else {
          await api.post(endpoint, payload);
          toast.success(
            createSuccessMessage || `${singular} created successfully`,
            { autoClose: 6000 }
          );
          setPage(0);
        }
        handleCloseForm();
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

    const handleDeleteRequest = (row) => {
      setPendingDelete(row);
      setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
      if (!pendingDelete) return;
      setSubmitting(true);
      try {
        if (allowDeactivate) {
          const { data: res } = await api.put(`${endpoint}/${pendingDelete.id}`, { status: 'inactive' });
          toast.success(res.message || `${singular} deactivated successfully`);
          if (res.sessionRevoked) {
            toast.info('The user has been signed out from all active sessions.', { autoClose: 5000 });
          }
        } else {
          await api.delete(`${endpoint}/${pendingDelete.id}`);
          toast.success(`${singular} deleted successfully`);
        }
        setConfirmOpen(false);
        setPendingDelete(null);
        if (rows.length <= 1 && page > 0) setPage((p) => p - 1);
        reload();
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
        toast.success(`${singular} password updated successfully.`);
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
      ...(enableReceptionistPermissions ? [{
        field: 'gender',
        headerName: 'Gender',
        render: (r) => formatGenderLabel(r.gender),
      }] : []),
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
      ...(enableReceptionistPermissions ? [{
        field: 'permissions',
        headerName: 'Conferences',
        sortable: false,
        render: (r) => <ConferencePermissionIcons permissions={r.permissions} />,
      }] : []),
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
      ...(enableReceptionistPermissions ? [{
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
      }] : []),
      ...(extraFields.some((f) => f.name === 'specialization') ? [{
        key: 'specialization',
        label: 'Specialization',
        value: specializationFilter,
        onChange: (v) => { setSpecializationFilter(v); setPage(0); },
        options: [
          { value: '', label: 'All Specializations' },
          ...specializationOptions.map((name) => ({ value: name, label: name })),
        ],
      }] : []),
      ...(extraFields.some((f) => f.name === 'profession') ? [{
        key: 'profession',
        label: 'Profession',
        value: professionFilter,
        onChange: (v) => { setProfessionFilter(v); setPage(0); },
        options: [
          { value: '', label: 'All Professions' },
          ...(professionOptions.length
            ? professionOptions
            : (selectOptions.profession || []).map((opt) => opt.value)
          ).map((name) => ({ value: name, label: name })),
        ],
      }] : []),
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
          loadingMore={loadingMore}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder={`Search ${title.toLowerCase()} by name, email, or ID...`}
          filters={staffFilters}
          headerActions={enableProfessionsManager ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<HealthAndSafetyOutlined />}
              onClick={() => setProfessionsOpen(true)}
              sx={{
                px: 2,
                py: 0.875,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              AHP Professions
            </Button>
          ) : null}
          actionLabel={canCreate ? addLabel : undefined}
          onAction={canCreate ? () => handleOpen() : undefined}
          actionIcon={PersonAddOutlined}
          onEdit={canEdit ? handleOpen : undefined}
          onView={enableView ? handleView : undefined}
          onDelete={canDelete ? handleDeleteRequest : undefined}
          onResetPassword={canResetPassword ? openResetDialog : undefined}
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
                <Grid size={{ xs: 12, sm: 6 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
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
                    <Grid size={{ xs: 12, sm: f.half ? 6 : 12 }} key={f.name}>
                      {f.weekdaySelect ? (
                        <Controller
                          name={f.name}
                          control={control}
                          render={({ field }) => {
                            const selected = field.value || [];
                            const toggleDay = (day) => {
                              const next = selected.includes(day)
                                ? selected.filter((item) => item !== day)
                                : [...selected, day];
                              field.onChange(WEEKDAYS.filter((item) => next.includes(item)));
                            };
                            return (
                              <Box
                                sx={{
                                  px: 1.75,
                                  py: 1.5,
                                  borderRadius: 3,
                                  border: '1px solid',
                                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
                                  bgcolor: 'background.paper',
                                }}
                              >
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.25 }}>
                                  <EventOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {f.label}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                                  {WEEKDAYS.map((day) => {
                                    const active = selected.includes(day);
                                    return (
                                      <Chip
                                        key={day}
                                        clickable
                                        size="small"
                                        label={day.slice(0, 3)}
                                        color={active ? 'primary' : 'default'}
                                        variant={active ? 'filled' : 'outlined'}
                                        onClick={() => toggleDay(day)}
                                        sx={{ fontWeight: 700, minWidth: 40 }}
                                      />
                                    );
                                  })}
                                </Stack>
                              </Box>
                            );
                          }}
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

              {enableReceptionistPermissions && (
                <SectionCard title="Permissions" icon={VerifiedUserOutlined}>
                  <ReceptionistPermissionFields value={permissions} onToggle={togglePermission} />
                </SectionCard>
              )}

              <SectionCard title="Account Status" icon={ToggleOnOutlined}>
                <Grid size={{ xs: 12 }}>
                  <AccountStatusToggle
                    name="status"
                    control={control}
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  />
                </Grid>
              </SectionCard>
            </DialogContent>
            <FormDialogActions
              onCancel={handleCloseForm}
              submitLabel={submitting ? 'Saving...' : editRow ? 'Save Changes' : `Create ${singular}`}
              loading={submitting}
            />
          </Box>
        </Dialog>

        {canResetPassword && (
          <Dialog open={resetOpen} onClose={handleFormDialogClose(() => setResetOpen(false), submitting)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Reset {singular} Password</DialogTitle>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}>
              <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set a new password for <strong>{resetTarget?.email}</strong>. Existing passwords cannot be retrieved.
                </Typography>
                <Stack spacing={2}>
                  <PasswordTextField
                    fullWidth label="New Password" required
                    placeholder={getFieldPlaceholder('newPassword', { type: 'password' })}
                    {...resetPasswordForm.register('password')}
                    error={!!resetPasswordForm.formState.errors.password}
                    helperText={resetPasswordForm.formState.errors.password?.message}
                  />
                  <PasswordTextField
                    fullWidth label="Confirm Password" required
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
            showPermissions={enableReceptionistPermissions}
          />
        )}

        {enableProfessionsManager && (
          <AhpProfessionsDialog
            open={professionsOpen}
            onClose={() => setProfessionsOpen(false)}
            onUpdated={reloadFieldOptions}
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
  enableReceptionistPermissions: true,
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
  enablePasswordReset: true,
  viewHeaderIcon: MedicalServicesOutlined,
  addButtonLabel: 'add GP',
  permissionResource: 'gps',
  extraFields: [
    { name: 'specialization', label: 'Specialization', half: true },
    { name: 'registration_number', label: 'Registration Number', hideInTable: true, half: true },
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
  hidePhoneColumn: true,
  enableView: true,
  enablePasswordReset: true,
  viewHeaderIcon: HealthAndSafetyOutlined,
  addButtonLabel: 'add AHP',
  permissionResource: 'ahps',
  enableProfessionsManager: true,
  fieldOptionsEndpoint: '/preferences/ahp-professions',
  extraFields: [
    { name: 'profession', label: 'Profession', select: true },
    { name: 'registration_number', label: 'Registration Number', hideInTable: true },
    { name: 'availability', label: 'Availability', weekdaySelect: true },
  ],
});
