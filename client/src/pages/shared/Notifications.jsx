import { useEffect, useState, useCallback } from 'react';
import {
  Paper, Typography, IconButton, Box, Stack, Chip, Divider,
  TextField, MenuItem, CircularProgress, Alert, InputAdornment, Button, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  NotificationsOutlined, DoneAllOutlined, SearchOutlined, MarkEmailReadOutlined,
  CloseOutlined, FilterListOutlined, InboxOutlined, PersonOutlined, TaskAltOutlined,
  EventOutlined, SecurityOutlined, InfoOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import useSystemDateTime from '../../hooks/useSystemDateTime';
import PageLoader from '../../components/PageLoader';

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
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (filter === 'unread') params.unread_only = 'true';
      const { data } = await api.get('/notifications', { params });
      setNotifications(data.data || []);
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = notifications.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q);
  });

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
                label={`${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}
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

          {unreadCount > 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={markingAll ? <CircularProgress size={14} color="inherit" /> : <DoneAllOutlined />}
              onClick={markAllRead}
              disabled={markingAll}
              sx={{
                flexShrink: 0,
                px: 2,
                py: 0.875,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.8125rem',
                boxShadow: '0 6px 16px rgba(30, 58, 95, 0.2)',
                '&:hover': { boxShadow: '0 8px 20px rgba(30, 58, 95, 0.26)' },
              }}
            >
              {markingAll ? 'Updating...' : 'Mark All Read'}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ ...fieldSx, flex: { lg: '1 1 240px' }, minWidth: { xs: '100%', sm: 220 }, maxWidth: { lg: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')} edge="end">
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
              onChange={(e) => setFilter(e.target.value)}
              sx={{ ...fieldSx, minWidth: 140 }}
            >
              <MenuItem value="all">All Notifications</MenuItem>
              <MenuItem value="unread">Unread Only</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mx: 2.5, mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Divider />

      {loading ? (
        <PageLoader message="Loading notifications..." />
      ) : filtered.length === 0 ? (
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
            {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {search ? 'Try adjusting your search' : "You're all caught up"}
          </Typography>
        </Box>
      ) : (
        <Box>
          {filtered.map((n, index) => (
            <Box key={n.id}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  py: 2,
                  alignItems: 'flex-start',
                  bgcolor: n.is_read
                    ? 'transparent'
                    : (theme) => alpha(theme.palette.primary.main, 0.03),
                  borderLeft: '3px solid',
                  borderLeftColor: n.is_read ? 'transparent' : 'primary.main',
                  transition: 'background-color 120ms ease',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, n.is_read ? 0.02 : 0.05),
                  },
                }}
              >
                <NotificationIcon type={n.type} read={n.is_read} />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: n.is_read ? 500 : 700, letterSpacing: '-0.01em' }}
                    >
                      {n.title}
                    </Typography>
                    {!n.is_read && (
                      <Chip
                        label="New"
                        size="small"
                        color="primary"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                      />
                    )}
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

                {!n.is_read && (
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={() => markRead(n.id)}
                      sx={{
                        flexShrink: 0,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) },
                      }}
                    >
                      <MarkEmailReadOutlined sx={{ fontSize: 18 }} color="primary" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              {index < filtered.length - 1 && <Divider sx={{ ml: n.is_read ? 0 : '3px' }} />}
            </Box>
          ))}
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Showing {filtered.length} of {notifications.length} notification{notifications.length === 1 ? '' : 's'}
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default Notifications;
