import {
  AppBar, Toolbar, IconButton, Typography, Box, Badge, Avatar,
  Menu, MenuItem, useMediaQuery, useTheme, Divider,
  ListItemIcon, Tooltip, Stack,
} from '@mui/material';
import {
  Menu as MenuIcon, Brightness4Outlined, Brightness7Outlined,
  NotificationsOutlined, PersonOutlined, LogoutOutlined, ChevronLeft,
  ChevronRight, KeyboardArrowDownOutlined, RefreshOutlined,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleSidebar, toggleDarkMode } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import api from '../services/api';
import { APP_NAME, ROLE_LABELS, ROLES } from '../utils/constants';
import { getPageMeta } from '../utils/pageMeta';
import SystemClock from './SystemClock';
import { usePageRefresh } from '../context/PageRefreshContext';
import useDarkModeAccess from '../hooks/useDarkModeAccess';
import { requestDesktopNotificationPermission } from '../utils/desktopNotifications';

const TOOLBAR_HEIGHT = 72;

const iconBtnSx = {
  width: 36,
  height: 36,
  p: 0,
  borderRadius: 1.5,
  color: 'text.secondary',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'transparent',
  '&:hover': {
    bgcolor: 'action.hover',
    color: 'text.primary',
    borderColor: 'text.disabled',
  },
};

const Header = ({ onMobileMenuOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { darkMode, sidebarOpen } = useSelector((state) => state.ui);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { refresh, refreshing } = usePageRefresh();
  const canUseDarkMode = useDarkModeAccess();

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/notifications?limit=1')
        .then(({ data }) => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    window.addEventListener('notifications:refresh', fetchUnread);
    return () => {
      clearInterval(timer);
      window.removeEventListener('notifications:refresh', fetchUnread);
    };
  }, [location.pathname]);

  const pageMeta = getPageMeta(location.pathname, user?.role, location.search);
  const showSystemClock = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);

  useEffect(() => {
    document.title = pageMeta.title ? `${pageMeta.title} · ${APP_NAME}` : APP_NAME;
    return () => { document.title = APP_NAME; };
  }, [pageMeta.title]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const displayName = user?.profile
    ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
    : user?.first_name
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : user?.email;

  const handleNavToggle = () => {
    if (isMobile) onMobileMenuOpen?.();
    else dispatch(toggleSidebar());
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar
        sx={{
          minHeight: TOOLBAR_HEIGHT,
          height: TOOLBAR_HEIGHT,
          px: { xs: 2, sm: 2.5, md: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Left: nav toggle + page title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
            flex: 1,
          }}
        >
          <Tooltip title={isMobile ? 'Open menu' : sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <IconButton
              onClick={handleNavToggle}
              aria-label="Toggle navigation"
              sx={iconBtnSx}
            >
              {isMobile ? (
                <MenuIcon sx={{ fontSize: 20 }} />
              ) : sidebarOpen ? (
                <ChevronLeft sx={{ fontSize: 20 }} />
              ) : (
                <ChevronRight sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              {pageMeta.title}
            </Typography>
            {pageMeta.subtitle && (
              <Typography
                variant="caption"
                noWrap
                sx={{
                  display: { xs: 'none', md: 'block' },
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                  maxWidth: { md: 480, lg: 640 },
                }}
              >
                {pageMeta.subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right: actions + profile */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Tooltip title="Refresh page data">
            <span>
              <IconButton
                onClick={() => refresh()}
                disabled={refreshing}
                sx={iconBtnSx}
              >
                <RefreshOutlined
                  sx={{
                    fontSize: 18,
                    animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>

          {showSystemClock && <SystemClock />}

          {canUseDarkMode && (
            <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={() => dispatch(toggleDarkMode())} sx={iconBtnSx}>
                {darkMode
                  ? <Brightness7Outlined sx={{ fontSize: 18 }} />
                  : <Brightness4Outlined sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Notifications">
            <IconButton
              onClick={async () => {
                await requestDesktopNotificationPermission();
                navigate('/notifications');
              }}
              sx={iconBtnSx}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.625rem',
                    height: 16,
                    minWidth: 16,
                    top: 4,
                    right: 4,
                  },
                }}
              >
                <NotificationsOutlined sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider
            orientation="vertical"
            sx={{
              height: 28,
              alignSelf: 'center',
              mx: 0.5,
              display: { xs: 'none', sm: 'block' },
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              alignItems: 'center',
              cursor: 'pointer',
              py: 0.5,
              borderRadius: 1,
              transition: 'opacity 120ms ease',
              '&:hover': { opacity: 0.85 },
            }}
          >
            <Avatar
              src={user?.profile?.profile_picture || user?.profile_picture || undefined}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontSize: '0.8125rem',
                fontWeight: 700,
              }}
            >
              {displayName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, lineHeight: 1.2 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: '0.8125rem', maxWidth: 120 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
                {ROLE_LABELS[user?.role]}
              </Typography>
            </Box>
            <KeyboardArrowDownOutlined sx={{ fontSize: 18, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
          </Stack>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { minWidth: 180, mt: 0.75 } } }}
        >
          <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
            <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
            Profile
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><LogoutOutlined fontSize="small" color="error" /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
