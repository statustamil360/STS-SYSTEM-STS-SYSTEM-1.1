import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogContent, Grid, MenuItem, Box, TextField, InputAdornment, Typography, Chip, Stack,
} from '@mui/material';
import {
  TaskAltOutlined, NotesOutlined, PersonOutlined, CalendarTodayOutlined,
  FlagOutlined, CheckCircleOutlined, BadgeOutlined, ScheduleOutlined,
  AutorenewOutlined, EventAvailableOutlined,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormDialogActions from '../../components/FormDialogActions';
import {
  PremiumDialogHeader, SectionCard, IconField, dialogPaperSx, dialogContentSx, fieldSx, SelectPlaceholderMenuItem,
  handleFormDialogClose, selectMenuSlotProps,
} from '../../components/PremiumFormFields';
import { getSelectSlotProps } from '../../utils/fieldPlaceholders';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import useRolePermissions from '../../hooks/useRolePermissions';
import { TASK_PRIORITY, TASK_STATUS, ROLE_LABELS, ROLES } from '../../utils/constants';
import { buildTaskPayload } from '../../utils/crudHelpers';
import useProgressiveTable from '../../hooks/useProgressiveTable';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const ASSIGNABLE_ROLE_ORDER = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP];

const STATUS_META = {
  pending: { icon: ScheduleOutlined, color: 'warning', hint: 'Not started yet' },
  in_progress: { icon: AutorenewOutlined, color: 'info', hint: 'Currently working on it' },
  completed: { icon: CheckCircleOutlined, color: 'success', hint: 'Finished and closed' },
};

const PRIORITY_COLOR = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

const MetaTile = ({ icon: Icon, label, value, color = 'primary' }) => (
  <Grid size={{ xs: 12, sm: 4 }}>
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: 'center',
        px: 1.5,
        py: 1.25,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.divider, 0.9),
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
          color: `${color}.main`,
        }}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', fontSize: '0.65rem' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{value}</Typography>
      </Box>
    </Stack>
  </Grid>
);

const StatusOptionCard = ({ status, selected, onSelect }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Box
        role="radio"
        tabIndex={0}
        aria-checked={selected}
        onClick={() => onSelect(status)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(status);
          }
        }}
        sx={{
          cursor: 'pointer',
          height: '100%',
          px: 1.75,
          py: 1.75,
          borderRadius: 2.5,
          border: '1.5px solid',
          borderColor: (theme) => (selected
            ? theme.palette[meta.color].main
            : alpha(theme.palette.divider, 0.9)),
          bgcolor: (theme) => (selected
            ? alpha(theme.palette[meta.color].main, 0.07)
            : 'background.paper'),
          boxShadow: (theme) => (selected
            ? `0 4px 16px ${alpha(theme.palette[meta.color].main, 0.18)}`
            : 'none'),
          transition: 'all 160ms ease',
          '&:hover': {
            borderColor: (theme) => alpha(theme.palette[meta.color].main, 0.6),
            transform: 'translateY(-1px)',
          },
          '&:focus-visible': {
            outline: (theme) => `2px solid ${theme.palette[meta.color].main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 0.5 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette[meta.color].main, selected ? 0.16 : 0.08),
              color: `${meta.color}.main`,
            }}
          >
            <Icon sx={{ fontSize: 17 }} />
          </Box>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: selected ? `${meta.color}.dark` : 'text.primary' }}
          >
            {formatLabel(status)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">{meta.hint}</Typography>
      </Box>
    </Grid>
  );
};

const Tasks = () => {
  const { formatDate } = useSystemDateTime();
  const { canEdit, canDelete } = useRolePermissions();
  const { user } = useSelector((state) => state.auth);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const canManage = !isClinical;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const {
    register, handleSubmit, reset, control, watch, setValue, formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      assigned_role: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
    },
  });

  const selectedRole = watch('assigned_role');

  const roleOptions = useMemo(() => {
    const present = new Set(assignableUsers.map((u) => u.role));
    return ASSIGNABLE_ROLE_ORDER.filter((role) => present.has(role));
  }, [assignableUsers]);

  const usersForRole = useMemo(
    () => (selectedRole ? assignableUsers.filter((u) => u.role === selectedRole) : []),
    [assignableUsers, selectedRole]
  );

  const fetchTasks = useCallback(async ({ page: pageNum, limit }) => {
    const { data } = await api.get('/tasks', {
      params: {
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: pageNum,
        limit,
      },
    });
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [search, statusFilter, priorityFilter]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload, error,
  } = useProgressiveTable(fetchTasks);

  useEffect(() => {
    if (error) toast.error('Failed to load tasks');
  }, [error]);

  useEffect(() => {
    if (canManage) {
      api.get('/staff/assignable-users')
        .then(({ data }) => setAssignableUsers(data.data ?? []))
        .catch(() => {});
    }
  }, [canManage]);

  const handleOpen = (row = null) => {
    setEditRow(row);
    const assignedUser = row
      ? assignableUsers.find((u) => String(u.id) === String(row.assigned_to))
      : null;
    reset(row ? {
      title: row.title,
      description: row.description || '',
      assigned_role: assignedUser?.role || '',
      assigned_to: row.assigned_to != null ? String(row.assigned_to) : '',
      due_date: row.due_date ? row.due_date.slice(0, 10) : '',
      priority: row.priority || 'medium',
      status: row.status || 'pending',
    } : {
      title: '', description: '', assigned_role: '', assigned_to: '', due_date: '', priority: 'medium', status: 'pending',
    });
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
  };

  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message || 'Please complete all required fields');
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = buildTaskPayload(formData, { editRow, isClinical });
      if (editRow) {
        await api.put(`/tasks/${editRow.id}`, payload);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created successfully');
        setPage(0);
      }
      handleCloseForm();
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (row) => {
    setPendingDelete(row);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.delete(`/tasks/${pendingDelete.id}`);
      toast.success('Task deleted successfully');
      if (rows.length <= 1 && page > 0) setPage((p) => p - 1);
      reload();
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const columns = [
    { field: 'title', headerName: 'Title' },
    { field: 'assigned_to_name', headerName: 'Assigned To' },
    { field: 'due_date', headerName: 'Due Date', render: (r) => (r.due_date ? formatDate(r.due_date) : '—') },
    { field: 'priority', headerName: 'Priority', type: 'status' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  const taskFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (v) => { setStatusFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Statuses' },
        ...TASK_STATUS.map((s) => ({ value: s, label: formatLabel(s) })),
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      value: priorityFilter,
      onChange: (v) => { setPriorityFilter(v); setPage(0); },
      options: [
        { value: '', label: 'All Priorities' },
        ...TASK_PRIORITY.map((p) => ({ value: p, label: formatLabel(p) })),
      ],
    },
  ];

  return (
    <>
      <DataTable
        title={isClinical ? 'My Tasks' : 'Task List'}
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
        searchPlaceholder="Search by title or assignee..."
        filters={taskFilters}
        actionLabel={canManage ? 'Create Task' : undefined}
        onAction={canManage ? () => handleOpen() : undefined}
        onEdit={canEdit ? handleOpen : undefined}
        onDelete={canManage && canDelete ? handleDelete : undefined}
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
          icon={TaskAltOutlined}
          title={editRow
            ? (isClinical ? 'Update Task Status' : 'Edit Task')
            : 'Create Task'}
          subtitle={editRow
            ? (isClinical
              ? 'Review your assigned task and update its progress status'
              : 'Update task details, priority, and status')
            : 'Assign and track operational or clinical tasks across staff'}
        />
        <Box
          key={editRow?.id ?? 'new'}
          component="form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={dialogContentSx}>
            <SectionCard title="Task Information" icon={TaskAltOutlined}>
              {isClinical && editRow ? (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
                        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.01)} 100%)`,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}
                        >
                          {editRow.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={formatLabel(editRow.status)}
                          color={STATUS_META[editRow.status]?.color || 'default'}
                          variant="outlined"
                          sx={{ fontWeight: 700, flexShrink: 0 }}
                        />
                      </Stack>
                      {editRow.description ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}
                        >
                          {editRow.description}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          No description provided
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <MetaTile
                    icon={FlagOutlined}
                    label="Priority"
                    value={formatLabel(editRow.priority)}
                    color={PRIORITY_COLOR[editRow.priority] || 'primary'}
                  />
                  <MetaTile
                    icon={EventAvailableOutlined}
                    label="Due Date"
                    value={editRow.due_date ? formatDate(editRow.due_date) : 'No due date'}
                  />
                  <MetaTile
                    icon={PersonOutlined}
                    label="Assigned To"
                    value={editRow.assigned_to_name?.trim() || 'You'}
                  />

                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mb: 1.25,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        fontSize: '0.6875rem',
                      }}
                    >
                      Update Progress
                    </Typography>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Grid container spacing={1.5} role="radiogroup" aria-label="Task status">
                          {TASK_STATUS.map((s) => (
                            <StatusOptionCard
                              key={s}
                              status={s}
                              selected={field.value === s}
                              onSelect={field.onChange}
                            />
                          ))}
                        </Grid>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <IconField
                      label="Progress Notes"
                      name="description"
                      multiline
                      rows={3}
                      icon={NotesOutlined}
                      register={register}
                    />
                  </Grid>
                </>
              ) : (
                <>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Title"
                  name="title"
                  icon={TaskAltOutlined}
                  register={register}
                  registerOptions={{ required: 'Title is required' }}
                  required
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <IconField
                  label="Description"
                  name="description"
                  multiline
                  rows={3}
                  icon={NotesOutlined}
                  register={register}
                />
              </Grid>
              {canManage && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="assigned_role"
                      control={control}
                      rules={{ required: 'Role is required' }}
                      render={({ field }) => (
                        <TextField
                          value={field.value ?? ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setValue('assigned_to', '', { shouldValidate: false });
                          }}
                          fullWidth
                          size="small"
                          select
                          label="Assign To Role"
                          required
                          error={!!errors.assigned_role}
                          helperText={errors.assigned_role?.message}
                          sx={fieldSx}
                          slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                                  <BadgeOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                                </InputAdornment>
                              ),
                            },
                            select: {
                              ...getSelectSlotProps({
                                defaultValue: '',
                                options: roleOptions.map((role) => ({
                                  value: role,
                                  label: ROLE_LABELS[role] || role,
                                })),
                              }),
                              MenuProps: selectMenuSlotProps,
                            },
                          }}
                        >
                          <SelectPlaceholderMenuItem />
                          {roleOptions.map((role) => (
                            <MenuItem key={role} value={role}>
                              {ROLE_LABELS[role] || role}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                      name="assigned_to"
                      control={control}
                      rules={{ required: 'Assignee is required' }}
                      render={({ field }) => (
                        <TextField
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          fullWidth
                          size="small"
                          select
                          label="Assigned To"
                          required
                          disabled={!selectedRole}
                          error={!!errors.assigned_to}
                          helperText={
                            errors.assigned_to?.message
                            || (!selectedRole
                              ? 'Select a role first'
                              : usersForRole.length === 0
                                ? 'No active staff in this role'
                                : undefined)
                          }
                          sx={fieldSx}
                          slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                                  <PersonOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                                </InputAdornment>
                              ),
                            },
                            select: {
                              ...getSelectSlotProps({
                                defaultValue: '',
                                options: usersForRole.map((u) => ({
                                  value: String(u.id),
                                  label: u.name,
                                })),
                              }),
                              MenuProps: selectMenuSlotProps,
                            },
                          }}
                        >
                          <SelectPlaceholderMenuItem />
                          {usersForRole.map((u) => (
                            <MenuItem key={u.id} value={String(u.id)}>
                              {u.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Due Date"
                  name="due_date"
                  type="date"
                  shrink
                  icon={CalendarTodayOutlined}
                  register={register}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <IconField
                  label="Priority"
                  name="priority"
                  select
                  icon={FlagOutlined}
                  control={control}
                >
                  {TASK_PRIORITY.map((p) => (
                    <MenuItem key={p} value={p}>{formatLabel(p)}</MenuItem>
                  ))}
                </IconField>
              </Grid>
              {editRow && (
                <Grid size={{ xs: 12 }}>
                  <IconField
                    label="Status"
                    name="status"
                    select
                    icon={CheckCircleOutlined}
                    control={control}
                    showSelectPlaceholder={false}
                  >
                    {TASK_STATUS.map((s) => (
                      <MenuItem key={s} value={s}>{formatLabel(s)}</MenuItem>
                    ))}
                  </IconField>
                </Grid>
              )}
                </>
              )}
            </SectionCard>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel={editRow ? (isClinical ? 'Update Status' : 'Update Task') : 'Create Task'}
            loading={submitting}
          />
        </Box>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${pendingDelete?.title || 'this task'}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </>
  );
};

export default Tasks;
