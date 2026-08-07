import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Box, Typography, Divider, Stack, Alert,
} from '@mui/material';
import { AdminPanelSettings, LockReset } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../services/api';
import { adminUpsertSchema, adminPasswordResetSchema } from '../../utils/formSchemas';
import { getFieldPlaceholder, selectMenuSlotProps } from '../../utils/fieldPlaceholders';
import { handleFormDialogClose } from '../../components/PremiumFormFields';

const AdminManagement = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: yupResolver(adminUpsertSchema),
    context: { isEdit: Boolean(editRow) },
  });

  const resetPasswordForm = useForm({
    resolver: yupResolver(adminPasswordResetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admins', { params: { search, page: page + 1, limit: rowsPerPage } });
      setRows(data.data ?? []);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [search, page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCloseForm = () => {
    setOpen(false);
    setEditRow(null);
  };

  const handleOpen = (row = null) => {
    setEditRow(row);
    reset(row ? {
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      email: row.email,
      phone: row.phone || '',
      status: row.status,
      newPassword: '',
      confirmNewPassword: '',
    } : {
      name: '', email: '', phone: '', password: '', confirmPassword: '', status: 'active',
    });
    setOpen(true);
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { newPassword, confirmNewPassword, ...payload } = formData;
      delete payload.confirmPassword;

      if (editRow) {
        await api.put(`/admins/${editRow.id}`, payload);
        if (newPassword) {
          await api.patch(`/admins/${editRow.id}/password`, { password: newPassword });
          toast.success('Admin updated and password reset successfully');
        } else {
          toast.success('Admin updated successfully');
        }
      } else {
        await api.post('/admins', payload);
        toast.success(
          'Admin created successfully. They can log in using the email and password you entered on the shared login page.',
          { autoClose: 6000 }
        );
        setPage(0);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
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
      await api.put(`/admins/${pendingDelete.id}`, { status: 'inactive' });
      toast.success('Admin deactivated successfully');
      setConfirmOpen(false);
      setPendingDelete(null);
      fetchData();
    } catch {
      toast.error('Failed to deactivate admin');
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
      await api.patch(`/admins/${resetTarget.id}/password`, { password: formData.password });
      toast.success('Password reset successfully. Share the new password securely with the admin.');
      setResetOpen(false);
      setResetTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'admin_code', headerName: 'Admin ID' },
    { field: 'first_name', headerName: 'Name', render: (r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—' },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone', render: (r) => r.phone || '—' },
    { field: 'status', headerName: 'Status', type: 'status' },
  ];

  return (
    <>
      <PageHeader
        title="Admin Management"
        subtitle="Create admin accounts with a login password. Admins sign in on the same login page as all other roles."
        actionLabel="Add Admin"
        onAction={() => handleOpen()}
      />

      <DataTable
        title="Administrators"
        columns={columns}
        rows={rows}
        loading={loading}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
        onSearch={(v) => { setSearch(v); setPage(0); }}
        searchPlaceholder="Search by name or email..."
        onEdit={handleOpen}
        onDelete={handleDeleteRequest}
        onResetPassword={openResetDialog}
      />

      <Dialog open={open} onClose={handleFormDialogClose(handleCloseForm, submitting)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <AdminPanelSettings color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editRow ? 'Edit Administrator' : 'Add Administrator'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {editRow
                  ? 'Update account details. Passwords cannot be viewed — set a new one below if needed.'
                  : 'Set the login password now. The admin will use this email and password on the shared login page.'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <Divider />
        <form key={editRow?.id ?? 'new'} onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ pt: 2.5 }}>
            {!editRow && (
              <Alert severity="info" sx={{ mb: 2 }}>
                The password you enter here is what the admin will use to log in. It is stored securely and cannot be viewed later.
              </Alert>
            )}
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required label="Full Name" placeholder={getFieldPlaceholder('name', { label: 'Full Name' })} {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth required label="Email Address" type="email" placeholder={getFieldPlaceholder('email')} {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Phone Number" placeholder={getFieldPlaceholder('phone')} {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
              </Grid>
              {!editRow && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Password" type="password" placeholder={getFieldPlaceholder('password', { type: 'password' })} {...register('password')} error={!!errors.password} helperText={errors.password?.message || 'Minimum 8 characters — admin uses this to log in'} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth required label="Confirm Password" type="password" placeholder={getFieldPlaceholder('confirmPassword', { type: 'password' })} {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
                  </Grid>
                </>
              )}
              {editRow && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>Reset Password (optional)</Typography>
                    <Typography variant="caption" color="text.secondary">Leave blank to keep the current password unchanged.</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="New Password" type="password" placeholder={getFieldPlaceholder('newPassword', { type: 'password' })} {...register('newPassword')} error={!!errors.newPassword} helperText={errors.newPassword?.message} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Confirm New Password" type="password" placeholder={getFieldPlaceholder('confirmNewPassword', { type: 'password' })} {...register('confirmNewPassword')} error={!!errors.confirmNewPassword} helperText={errors.confirmNewPassword?.message} />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      select
                      required={!!editRow}
                      label="Status"
                      value={field.value ?? 'active'}
                      onChange={(e) => field.onChange(e.target.value)}
                      error={!!errors.status}
                      helperText={errors.status?.message}
                      slotProps={{ select: { MenuProps: selectMenuSlotProps } }}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      {editRow && <MenuItem value="disabled">Disabled</MenuItem>}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseForm} color="inherit" disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : editRow ? 'Save Changes' : 'Create Admin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={resetOpen} onClose={handleFormDialogClose(() => setResetOpen(false), submitting)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Admin Password</DialogTitle>
        <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set a new password for <strong>{resetTarget?.email}</strong>. Existing passwords cannot be retrieved.
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth required label="New Password" type="password"
                placeholder={getFieldPlaceholder('newPassword', { type: 'password' })}
                {...resetPasswordForm.register('password')}
                error={!!resetPasswordForm.formState.errors.password}
                helperText={resetPasswordForm.formState.errors.password?.message}
              />
              <TextField
                fullWidth required label="Confirm Password" type="password"
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

      <ConfirmDialog
        open={confirmOpen}
        title="Deactivate Administrator"
        message={`Are you sure you want to deactivate ${pendingDelete?.email || 'this admin'}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        loading={submitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </>
  );
};

export default AdminManagement;
