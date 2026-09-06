import { useEffect, useState, useCallback } from 'react';
import {
  Paper, Typography, IconButton, Box, Stack, Chip, Divider,
  TextField, MenuItem, Alert, InputAdornment, Button, Tooltip,
  Checkbox, Dialog, DialogContent, TablePagination,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  NotificationsOutlined, SearchOutlined,
  CloseOutlined, FilterListOutlined, InboxOutlined, PersonOutlined, TaskAltOutlined,
  EventOutlined, SecurityOutlined, InfoOutlined, DeleteOutlined, VisibilityOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import PageLoader from '../../components/PageLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { PremiumDialogHeader, dialogPaperSx, dialogContentSx } from '../../components/PremiumFormFields';
import { refreshNotificationBadge } from '../../utils/notificationRefresh';

const PAGE_SIZE = 15;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.default',
    fontSize: '0.875rem',
    '& fieldset': { borderColor: alpha('#64748B', 0.22) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.4) },
    '&.Mui-focused': {
      bgcolor: 'background.paper',
      boxShadow: '0 0 0 3px rgba(30, 58, 95, 0.08)',
    },
  },
};

const TYPE_ICONS = {
  patient: PersonOutlined,
  task: TaskAltOutlined,
  appointment: EventOutlined,
  security: SecurityOutlined,
};

const TYPE_COLORS = {
  patient: 'info',
  task: 'warning',
  appointment: 'success',
  security: 'error',
};

const formatType = (type) => type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'System';

const NotificationIcon = ({ type, read }) => {
  const Icon = TYPE_ICONS[type] || NotificationsOutlined;
  const color = TYPE_COLORS[type] || 'primary';
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: (theme) => (read
          ? alpha(theme.palette.text.secondary, 0.08)
          : alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.12)),
        color: read ? 'text.disabled' : `${color}.main`,
      }}
    >
      <Icon sx={{ fontSize: 22 }} />
    </Box>
  );
};

const Notifications = () => {
  const { formatDateTime } = useSystemDateTime();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: page + 1, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (filter === 'unread') params.is_read = 'false';
      if (filter === 'read') params.is_read = 'true';
      const { data } = await api.get('/notifications', { params });
      setNotifications(data.data || []);
      setTotal(data.pagination?.total ?? (data.data || []).length);
      setUnreadCount(data.unreadCount || 0);
      setSelectedIds([]);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, page, search]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const refreshAfterChange = async () => {
    await fetchNotifications();
    refreshNotificationBadge();
  };

  const handleView = async (row) => {
    try {
      const { data } = await api.get(`/notifications/${row.id}`);
      setViewItem(data.data);
      setViewOpen(true);
      if (!row.is_read) {
        await api.patch(`/notifications/${row.id}/read`);
        refreshNotificationBadge();
        setNotifications((prev) => prev.map((n) => (n.id === row.id ? { ...n, is_read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      toast.error('Failed to open notification');
    }
  };

  const requestDelete = (ids) => {
    setPendingDelete(ids);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const ids = pendingDelete || [];
    try {
      if (ids.length === 1) {
        await api.delete(`/notifications/${ids[0]}`);
      } else {
        await api.delete('/notifications/selected', { data: { ids } });
      }
      toast.success(ids.length === 1 ? 'Notification deleted' : 'Selected notifications deleted');
      if (notifications.length <= ids.length && page > 0) setPage((p) => p - 1);
      await refreshAfterChange();
    } catch {
      toast.error('Failed to delete notification');
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  };

  const pageIds = notifications.map((n) => n.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageIds.some((id) => selectedIds.includes(id));

  const toggleOne = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAllPage = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) return prev.filter((id) => !pageIds.includes(id));
      return [...new Set([...prev, ...pageIds])];
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.5, pb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
              Inbox
            </Typography>
            {!loading && (
              <Chip
                label={`${total} notification${total === 1 ? '' : 's'}`}
                size="small"
                sx={{
                  height: 24,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  border: '1px solid',
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                }}
              />
            )}
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 24, fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
          </Stack>

          {selectedIds.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlined />}
              onClick={() => requestDelete(selectedIds)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Delete ({selectedIds.length})
            </Button>
          )}
        </Stack>

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { lg: 'center' }, flexWrap: 'wrap' }}
        >
          <TextField
            size="small"
            placeholder="Search notifications..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ ...fieldSx, flex: { lg: '1 1 240px' }, minWidth: { xs: '100%', sm: 220 }, maxWidth: { lg: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchInput('')} edge="end">
                      <CloseOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <FilterListOutlined sx={{ fontSize: 18, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            <TextField
              select
              size="small"
              label="Filter"
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
              sx={{ ...fieldSx, minWidth: 160 }}
            >
              <MenuItem value="all">All Notifications</MenuItem>
              <MenuItem value="unread">Unread Only</MenuItem>
              <MenuItem value="read">Read Only</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mx: 2.5, mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Divider />

      {loading ? (
        <PageLoader message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              color: 'text.secondary',
            }}
          >
            <InboxOutlined sx={{ fontSize: 28 }} />
          </Box>
          <Typography sx={{ fontWeight: 600 }} color="text.secondary">
            {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications found'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {search ? 'Try adjusting your search' : "You're all caught up"}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              px: { xs: 1.25, sm: 1.75 },
              py: 1,
              alignItems: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Checkbox
              size="small"
              checked={allPageSelected}
              indeterminate={somePageSelected && !allPageSelected}
              onChange={toggleAllPage}
              inputProps={{ 'aria-label': 'Select all notifications on this page' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {selectedIds.length ? `${selectedIds.length} selected` : 'Select notifications'}
            </Typography>
          </Stack>

          {notifications.map((n, index) => (
            <Box key={n.id}>
              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  px: { xs: 1.25, sm: 1.75 },
                  py: 1.75,
                  alignItems: 'flex-start',
                  bgcolor: n.is_read
                    ? 'transparent'
                    : (theme) => alpha(theme.palette.primary.main, 0.03),
                  borderLeft: '3px solid',
                  borderLeftColor: n.is_read ? 'transparent' : 'primary.main',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, n.is_read ? 0.02 : 0.05),
                  },
                }}
              >
                <Checkbox
                  size="small"
                  checked={selectedIds.includes(n.id)}
                  onChange={() => toggleOne(n.id)}
                  sx={{ mt: 0.5 }}
                  inputProps={{ 'aria-label': `Select ${n.title}` }}
                />
                <NotificationIcon type={n.type} read={n.is_read} />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: n.is_read ? 500 : 700, letterSpacing: '-0.01em' }}
                    >
                      {n.title}
                    </Typography>
                    <Chip
                      label={n.is_read ? 'Read' : 'Unread'}
                      size="small"
                      color={n.is_read ? 'default' : 'primary'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                    {n.type && (
                      <Chip
                        label={formatType(n.type)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, lineHeight: 1.6 }}>
                    {n.message}
                  </Typography>

                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {formatDateTime(n.created_at)}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, pt: 0.25 }}>
                  <Tooltip title="View notification">
                    <IconButton
                      size="small"
                      onClick={() => handleView(n)}
                      sx={{
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.info.main, 0.15) },
                      }}
                    >
                      <VisibilityOutlined sx={{ fontSize: 18 }} color="info" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete notification">
                    <IconButton
                      size="small"
                      onClick={() => requestDelete([n.id])}
                      sx={{
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.15) },
                      }}
                    >
                      <DeleteOutlined sx={{ fontSize: 18 }} color="error" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              {index < notifications.length - 1 && <Divider sx={{ ml: n.is_read ? 0 : '3px' }} />}
            </Box>
          ))}
        </Box>
      )}

      {!loading && total > 0 && (
        <Box
          sx={{
            px: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, next) => setPage(next)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            labelRowsPerPage="Per page"
          />
        </Box>
      )}

      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <PremiumDialogHeader
          icon={NotificationsOutlined}
          title="Notification Details"
          subtitle={viewItem?.is_read ? 'Read notification' : 'Unread notification'}
        />
        <DialogContent dividers sx={dialogContentSx}>
          {viewItem && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label={viewItem.is_read ? 'Read' : 'Unread'}
                  color={viewItem.is_read ? 'default' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                {viewItem.type && (
                  <Chip label={formatType(viewItem.type)} size="small" variant="outlined" />
                )}
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                  TITLE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{viewItem.title}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                  MESSAGE
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {viewItem.message || '—'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Received {formatDateTime(viewItem.created_at)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => setViewOpen(false)}>Close</Button>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={pendingDelete?.length > 1 ? 'Delete Notifications' : 'Delete Notification'}
        message={pendingDelete?.length > 1
          ? `Delete ${pendingDelete.length} selected notifications? This cannot be undone.`
          : 'Delete this notification? This cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }}
      />
    </Paper>
  );
};

export default Notifications;
