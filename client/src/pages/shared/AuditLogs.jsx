import { useEffect, useState, useCallback } from 'react';
import {
  DownloadOutlined, FilterListOutlined, SecurityOutlined,
} from '@mui/icons-material';
import {
  Grid, TextField, MenuItem, Stack, Chip, Button,
  CircularProgress, InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { toast } from 'react-toastify';
import DataTable from '../../components/DataTable';
import {
  PremiumPageCard, PremiumSection, adminFieldSx, premiumButtonSx,
} from '../../components/PremiumPageLayout';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import { refreshNotificationBadge } from '../../utils/notificationRefresh';
import useProgressiveTable from '../../hooks/useProgressiveTable';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'export', label: 'Export' },
  { value: 'settings_change', label: 'Settings Change' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'auth', label: 'Auth' },
  { value: 'audit_logs', label: 'Audit Logs' },
  { value: 'report', label: 'Report' },
  { value: 'patient', label: 'Patient' },
  { value: 'user', label: 'User' },
];

const actionColor = (action) => {
  if (!action) return 'default';
  if (action.includes('login') || action.includes('create')) return 'success';
  if (action.includes('delete') || action.includes('logout')) return 'error';
  if (action.includes('update') || action.includes('export')) return 'info';
  return 'default';
};

const AuditLogs = () => {
  const { formatDateTime } = useSystemDateTime();
  const [filters, setFilters] = useState({ action: '', entity_type: '' });
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async ({ page: pageNum, limit }) => {
    const params = { page: pageNum, limit };
    if (filters.action) params.action = filters.action;
    if (filters.entity_type) params.entity_type = filters.entity_type;
    const { data } = await api.get('/audit', { params });
    return { rows: data.data ?? [], total: data.pagination?.total ?? 0 };
  }, [filters]);

  const {
    rows, loading, loadingMore, total, page, setPage, rowsPerPage, setRowsPerPage, error,
  } = useProgressiveTable(fetchLogs);

  useEffect(() => {
    if (error) toast.error('Failed to load audit logs');
  }, [error]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/audit/export', { params: { format: 'csv' }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit log export downloaded');
      refreshNotificationBadge();
    } catch {
      toast.error('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { field: 'user_name', headerName: 'User', render: (r) => r.user_name || r.email || 'System' },
    {
      field: 'action',
      headerName: 'Action',
      render: (r) => {
        const color = actionColor(r.action);
        return (
          <Chip
            label={r.action?.replace(/_/g, ' ')}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'capitalize',
              bgcolor: (theme) => alpha(theme.palette[color]?.main || theme.palette.grey[500], 0.1),
              color: color === 'default' ? 'text.secondary' : `${color}.dark`,
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette[color]?.main || theme.palette.grey[400], 0.2),
            }}
          />
        );
      },
    },
    { field: 'entity_type', headerName: 'Entity', render: (r) => r.entity_type || '—' },
    { field: 'ip_address', headerName: 'IP Address', render: (r) => r.ip_address || '—' },
    { field: 'created_at', headerName: 'Timestamp', render: (r) => formatDateTime(r.created_at) },
  ];

  const exportButton = (
    <Button
      variant="contained"
      size="small"
      onClick={handleExport}
      disabled={exporting}
      startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadOutlined />}
      sx={{ ...premiumButtonSx, py: 0.875, fontSize: '0.8125rem' }}
    >
      {exporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );

  return (
    <Stack spacing={2.5}>
      <PremiumPageCard
        icon={SecurityOutlined}
        title="Audit Logs"
        subtitle="Complete activity trail of user actions, system events, and security changes"
        action={exportButton}
      >
        <PremiumSection
          icon={FilterListOutlined}
          title="Filter Activity"
          subtitle="Narrow results by action type or entity"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Action"
                value={filters.action}
                onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(0); }}
                sx={adminFieldSx}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ ml: 0.5 }}>
                        <FilterListOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                {ACTION_OPTIONS.map((o) => <MenuItem key={o.value || 'all'} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                select
                label="Entity Type"
                value={filters.entity_type}
                onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(0); }}
                sx={adminFieldSx}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start" sx={{ ml: 0.5 }}>
                        <SecurityOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              >
                {ENTITY_OPTIONS.map((o) => <MenuItem key={o.value || 'all'} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </PremiumSection>
      </PremiumPageCard>

      <DataTable
        title="Activity Log"
        columns={columns}
        rows={rows}
        loading={loading}
        loadingMore={loadingMore}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRowsPerPage(v); setPage(0); }}
        actions={false}
      />
    </Stack>
  );
};

export default AuditLogs;
