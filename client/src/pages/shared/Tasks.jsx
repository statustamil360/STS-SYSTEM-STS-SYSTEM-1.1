import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogContent, Grid, MenuItem, Box, TextField, InputAdornment,
} from '@mui/material';
import {
  TaskAltOutlined, NotesOutlined, PersonOutlined, CalendarTodayOutlined,
  FlagOutlined, CheckCircleOutlined,
} from '@mui/icons-material';
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
import { TASK_PRIORITY, TASK_STATUS, ROLE_LABELS, ROLES } from '../../utils/constants';
import { buildTaskPayload } from '../../utils/crudHelpers';

const formatLabel = (value) => value?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';

const Tasks = () => {
  const { formatDate } = useSystemDateTime();
  const { user } = useSelector((state) => state.auth);
  const isClinical = [ROLES.GP, ROLES.AHP].includes(user?.role);
  const canManage = !isClinical;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
    },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRows(data.data ?? []);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [search, statusFilter, priorityFilter, page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (canManage) {
      api.get('/staff/assignable-users')
        .then(({ data }) => setAssignableUsers(data.data ?? []))
        .catch(() => {});
    }
  }, [canManage]);

  const handleOpen = (row = null) => {
    setEditRow(row);
    reset(row ? {
      title: row.title,
      description: row.description || '',
      assigned_to: row.assigned_to != null ? String(row.assigned_to) : '',
      due_date: row.due_date ? row.due_date.slice(0, 10) : '',
      priority: row.priority || 'medium',
      status: row.status || 'pending',
    } : {
      title: '', description: '', assigned_to: '', due_date: '', priority: 'medium', status: 'pending',
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
      fetchData();
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
      fetchData();
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
        onEdit={handleOpen}
        onDelete={canManage ? handleDelete : undefined}
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
          title={editRow ? 'Edit Task' : 'Create Task'}
          subtitle={editRow
            ? 'Update task details, priority, and status'
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
                <Grid size={{ xs: 12 }}>
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
                        error={!!errors.assigned_to}
                        helperText={errors.assigned_to?.message}
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
                              options: assignableUsers.map((u) => ({
                                value: String(u.id),
                                label: `${u.name} (${ROLE_LABELS[u.role] || u.role})`,
                              })),
                            }),
                            MenuProps: selectMenuSlotProps,
                          },
                        }}
                      >
                        <SelectPlaceholderMenuItem />
                        {assignableUsers.map((u) => (
                          <MenuItem key={u.id} value={String(u.id)}>
                            {u.name} ({ROLE_LABELS[u.role] || u.role})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
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
            </SectionCard>
          </DialogContent>
          <FormDialogActions
            onCancel={handleCloseForm}
            submitLabel={editRow ? 'Update Task' : 'Create Task'}
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
