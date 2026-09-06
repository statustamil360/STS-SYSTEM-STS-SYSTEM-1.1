import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogActions, Grid, MenuItem, Box, TextField, InputAdornment, Typography, Chip, Stack,
  Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
} from '@mui/material';
import {
  TaskAltOutlined, NotesOutlined, PersonOutlined, CalendarTodayOutlined,
  FlagOutlined, CheckCircleOutlined, BadgeOutlined, ScheduleOutlined,
  AutorenewOutlined, EventAvailableOutlined, DeleteOutlined, FolderOutlined,
  InsertDriveFileOutlined, DownloadOutlined,
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
import { openTaskFilePreview, downloadTaskFile } from '../../utils/filePreview';
import useProgressiveTable from '../../hooks/useProgressiveTable';
import FileDropZone from '../../components/FileDropZone';
import { refreshNotificationBadge } from '../../utils/notificationRefresh';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const ASSIGNABLE_ROLE_ORDER = [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.GP, ROLES.AHP];
const TASK_TABS = ['inbox', 'assigned'];
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

const TaskFileAttach = ({
  selectedFiles,
  setSelectedFiles,
  existingFiles,
  onRemoveExisting,
  onViewExisting,
}) => (
  <Grid size={{ xs: 12 }}>
    <FileDropZone
      selectedFiles={selectedFiles}
      onAddFiles={(files) => setSelectedFiles((prev) => [...prev, ...files])}
      onRemoveSelected={(idx) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
    >
      {existingFiles.length > 0 && (
        <List dense sx={{ mt: 0.5, bgcolor: 'background.paper', borderRadius: 2 }}>
          {existingFiles.map((file) => (
            <ListItem key={file.id} divider>
              <ListItemText
                primary={file.original_name}
                secondary={file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
              />
              <ListItemSecondaryAction>
                <Button size="small" onClick={() => onViewExisting(file.id)} sx={{ mr: 1 }}>
                  View
                </Button>
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={() => onRemoveExisting(file.id)}
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
);

const Tasks = () => {
  const { formatDate, formatDateTime } = useSystemDateTime();
  const { canCreate, canEdit, canDelete } = useRolePermissions('tasks');
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TASK_TABS.includes(requestedTab) ? requestedTab : 'inbox';
  const isAssignedTab = activeTab === 'assigned';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState(null);
  const {
    register, handleSubmit, reset, control, watch, setValue, formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      task_update: '',
      assigned_role: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
    },
  });

  const selectedRole = watch('assigned_role');
  const progressOnly = Boolean(editRow && !isAssignedTab);

  useEffect(() => {
    if (!TASK_TABS.includes(requestedTab)) {
      setSearchParams({ tab: 'inbox' }, { replace: true });
    }
  }, [requestedTab, setSearchParams]);

  const roleOptions = useMemo(() => {
    const present = new Set(assignableUsers.map((u) => u.role));
    return ASSIGNABLE_ROLE_ORDER.filter((role) => present.has(role));
  }, [assignableUsers]);

  const usersForRole = useMemo(() => {
    const list = selectedRole ? assignableUsers.filter((u) => u.role === selectedRole) : [];
    return isAssignedTab ? list.filter((u) => Number(u.id) !== Number(user?.id)) : list;
  }, [assignableUsers, selectedRole, isAssignedTab, user?.id]);

  const fetchTasks = useCallback(async ({ page: pageNum, limit }) => {
    const { data } = await api.get('/tasks', {
      params: {
        scope: activeTab,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: pageNum,
        limit,
      },
    });
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [activeTab, search, statusFilter, priorityFilter]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, reload, error,
  } = useProgressiveTable(fetchTasks);

  useEffect(() => {
    if (error) toast.error('Failed to load tasks');
  }, [error]);

  useEffect(() => {
    api.get('/staff/assignable-users')
      .then(({ data }) => setAssignableUsers(data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let lastInbox = null;
    let lastAssigned = null;
    const checkUnread = () => {
      api.get('/tasks/unread-count')
        .then(({ data }) => {
          const inboxCount = Number(data.inboxCount ?? data.count) || 0;
          const assignedCount = Number(data.assignedUpdateCount) || 0;
          if (!isAssignedTab && lastInbox != null && inboxCount > lastInbox) reload();
          if (isAssignedTab && lastAssigned != null && assignedCount > lastAssigned) reload();
          lastInbox = inboxCount;
          lastAssigned = assignedCount;
        })
        .catch(() => {});
    };
    const timer = window.setInterval(checkUnread, 12000);
    return () => window.clearInterval(timer);
  }, [isAssignedTab, reload]);

  const handleOpen = async (row = null) => {
    setSelectedFiles([]);
    setExistingFiles([]);
    let detail = row;
    if (row?.id) {
      try {
        const { data } = await api.get(`/tasks/${row.id}`);
        detail = data.data;
        setExistingFiles(detail.files || []);
      } catch {
        toast.error('Failed to load task details');
        return;
      }
    }

    setEditRow(detail);
    const assignedUser = detail
      ? assignableUsers.find((u) => String(u.id) === String(detail.assigned_to))
      : null;
    reset(detail ? {
      title: detail.title,
      description: detail.description || '',
      task_update: '',
      assigned_role: assignedUser?.role || '',
      assigned_to: detail.assigned_to != null ? String(detail.assigned_to) : '',
      due_date: detail.due_date ? String(detail.due_date).slice(0, 10) : '',
      priority: detail.priority || 'medium',
      status: detail.status || 'pending',
    } : {
      title: '',
      description: '',
      task_update: '',
      assigned_role: isAssignedTab ? '' : (user?.role || ''),
      assigned_to: isAssignedTab ? '' : String(user?.id || ''),
      due_date: '',
      priority: 'medium',
      status: 'pending',
    });
    setOpen(true);
  };

  const handleView = async (row) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const { data } = await api.get(`/tasks/${row.id}`);
      setViewData(data.data);
      await api.post(`/tasks/${row.id}/assigner-read`).catch(() => {});
      reload();
      window.dispatchEvent(new CustomEvent('tasks:inbox-refresh'));
      refreshNotificationBadge();
    } catch {
      toast.error('Failed to load task details');
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    if (!viewData?.id) return;
    try {
      await downloadTaskFile(viewData.id, file.id, file.original_name);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
    setSelectedFiles([]);
    setExistingFiles([]);
  };

  const onInvalid = (formErrors) => {
    const firstError = Object.values(formErrors).find((e) => e?.message);
    toast.error(firstError?.message || 'Please complete all required fields');
  };

  const sendTask = async (payload, isEdit) => {
    if (selectedFiles.length) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        form.append(key, val == null ? '' : String(val));
      });
      selectedFiles.forEach((file) => form.append('files', file));
      if (isEdit) await api.put(`/tasks/${editRow.id}`, form);
      else await api.post('/tasks', form);
      return;
    }
    if (isEdit) await api.put(`/tasks/${editRow.id}`, payload);
    else await api.post('/tasks', payload);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const payload = buildTaskPayload(formData, {
        editRow,
        progressOnly,
        assignToSelf: !isAssignedTab,
        userId: user?.id,
      });
      if (isAssignedTab && !progressOnly && !payload.assigned_to) {
        toast.error('Assignee is required');
        return;
      }
      await sendTask(payload, Boolean(editRow));
      toast.success(editRow ? 'Task updated successfully' : 'Task created successfully');
      handleCloseForm();
      if (!editRow) setPage(0);
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

  const handleRemoveExistingFile = async (fileId) => {
    if (!editRow?.id) return;
    try {
      await api.delete(`/tasks/${editRow.id}/files/${fileId}`);
      setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
      toast.success('File removed');
    } catch {
      toast.error('Failed to remove file');
    }
  };

  const isUnreadTask = (row) => (
    isAssignedTab ? !row.assigner_read_at : !row.assignee_read_at
  );

  const renderTitle = (row) => {
    const unread = isUnreadTask(row);
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
        <Typography variant="body2" sx={{ fontWeight: unread ? 700 : 500 }}>
          {row.title || '—'}
        </Typography>
        <Chip
          label={unread ? 'Unread' : 'Read'}
          size="small"
          color={unread ? 'primary' : 'default'}
          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
        />
      </Stack>
    );
  };

  const columns = isAssignedTab
    ? [
      { field: 'title', headerName: 'Title', render: renderTitle },
      { field: 'assigned_to_name', headerName: 'Assigned To' },
      { field: 'due_date', headerName: 'Due Date', render: (r) => (r.due_date ? formatDate(r.due_date) : '—') },
      { field: 'priority', headerName: 'Priority', type: 'status' },
      { field: 'status', headerName: 'Status', type: 'status' },
    ]
    : [
      { field: 'title', headerName: 'Title', render: renderTitle },
      { field: 'assigned_by_name', headerName: 'Assigned By' },
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
        title={isAssignedTab ? 'Assigned by Me' : 'Assigned to Me'}
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
        searchPlaceholder={isAssignedTab ? 'Search by title or assignee...' : 'Search by title or assigned by...'}
        filters={taskFilters}
        actionLabel={canCreate ? (isAssignedTab ? 'Assign Task' : 'Create Task') : undefined}
        onAction={canCreate ? () => handleOpen() : undefined}
        onView={handleView}
        onEdit={canEdit ? handleOpen : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        actions
        isRowHighlighted={isUnreadTask}
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
            ? (progressOnly ? 'Update Task Status' : 'Edit Task')
            : (isAssignedTab ? 'Assign Task' : 'Create Task')}
          subtitle={editRow
            ? (progressOnly
              ? 'Review your assigned task and update its progress status'
              : 'Update task details, priority, and attachments')
            : (isAssignedTab
              ? 'Assign a task to another staff member and attach supporting files'
              : 'Create a task for yourself and attach supporting files')}
        />
        <Box
          key={`${editRow?.id ?? 'new'}-${activeTab}`}
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <DialogContent dividers sx={dialogContentSx}>
            <SectionCard title="Task Information" icon={TaskAltOutlined}>
              {progressOnly ? (
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
                    label="Assigned By"
                    value={editRow.assigned_by_name?.trim() || 'Staff'}
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
                      label="Task Update"
                      name="task_update"
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
              {isAssignedTab && (
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
                                ? 'No other active staff in this role'
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
              {!progressOnly && (
                <TaskFileAttach
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  existingFiles={existingFiles}
                  onRemoveExisting={handleRemoveExistingFile}
                  onViewExisting={(fileId) => openTaskFilePreview(editRow?.id, fileId)}
                />
              )}
            </SectionCard>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel={editRow ? (progressOnly ? 'Update Status' : 'Update Task') : (isAssignedTab ? 'Assign Task' : 'Create Task')}
            loading={submitting}
          />
        </Box>
      </Dialog>

      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={TaskAltOutlined}
          title="Task Details"
          subtitle="Assignment details and files sent with this task"
        />
        <DialogContent dividers sx={dialogContentSx}>
          {viewLoading ? (
            <Typography color="text.secondary" py={4} textAlign="center">Loading details...</Typography>
          ) : viewData ? (
            <>
              <SectionCard title="Task Information" icon={TaskAltOutlined}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{viewData.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {viewData.description || 'No description provided'}
                  </Typography>
                </Grid>
                <MetaTile
                  icon={PersonOutlined}
                  label="Assigned By"
                  value={viewData.assigned_by_name?.trim() || '—'}
                />
                <MetaTile
                  icon={PersonOutlined}
                  label="Assigned To"
                  value={viewData.assigned_to_name?.trim() || '—'}
                />
                <MetaTile
                  icon={EventAvailableOutlined}
                  label="Due Date"
                  value={viewData.due_date ? formatDate(viewData.due_date) : 'No due date'}
                />
                <MetaTile
                  icon={FlagOutlined}
                  label="Priority"
                  value={formatLabel(viewData.priority)}
                  color={PRIORITY_COLOR[viewData.priority] || 'primary'}
                />
                <MetaTile
                  icon={CheckCircleOutlined}
                  label="Status"
                  value={formatLabel(viewData.status)}
                  color={STATUS_META[viewData.status]?.color || 'primary'}
                />
              </SectionCard>

              <SectionCard title="Attached Files" icon={FolderOutlined}>
                {viewData.files?.length ? (
                  <Grid size={{ xs: 12 }}>
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
                            <Typography variant="caption" color="text.secondary">
                              {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attached file'}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openTaskFilePreview(viewData.id, file.id)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<DownloadOutlined />}
                            onClick={() => handleDownloadFile(file)}
                          >
                            Download
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  </Grid>
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Typography color="text.secondary">No files were attached to this task.</Typography>
                  </Grid>
                )}
              </SectionCard>

              <SectionCard title="Task Updates" icon={NotesOutlined}>
                {viewData.updates?.length ? (
                  <Grid size={{ xs: 12 }}>
                    <Stack spacing={1.25}>
                      {viewData.updates.map((update) => (
                        <Box
                          key={update.id}
                          sx={{
                            p: 1.75,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                          }}
                        >
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mb: 0.75, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {update.author_name || 'Staff'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(update.created_at)}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                            {update.message}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Typography color="text.secondary">No task updates yet.</Typography>
                  </Grid>
                )}
              </SectionCard>
            </>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewOpen(false)} variant="contained">Close</Button>
        </DialogActions>
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
