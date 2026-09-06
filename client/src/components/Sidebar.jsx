import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Box, Typography, ListSubheader,
} from '@mui/material';
import {
  Dashboard, People, AdminPanelSettings, Speed, Assessment, History,
  Settings, Notifications, Security, SupportAgent, LocalHospital,
  MedicalServices, HealthAndSafety, VideoCall, TaskAlt, Event, NoteAlt,
  Description, Person, Tune, ExpandLess, ExpandMore, Shield, AccessTime,
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { alpha } from '@mui/material/styles';
import { MENU_CONFIG } from '../utils/menuConfig';
import useReceptionistPermissions from '../hooks/useReceptionistPermissions';
import { getReceptionistPageKeyForPath } from '../utils/receptionistPermissions';
import { ROLES } from '../utils/constants';
import { DRAWER_WIDTH } from '../utils/layout';
import api from '../services/api';

const ICON_MAP = {
  Dashboard, People, AdminPanelSettings, Speed, Assessment, History,
  Settings, Notifications, Security, SupportAgent, LocalHospital,
  MedicalServices, HealthAndSafety, VideoCall, TaskAlt, Event, NoteAlt,
  Description, Person, Tune, AccessTime,
};

const BRAND_GRADIENT = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
const ACTIVE_GRADIENT = 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)';

const SUPER_ADMIN = {
  bg: '#0B1120',
  header: '#070D18',
  border: '#1E293B',
  text: '#CBD5E1',
  muted: '#64748B',
  activeText: '#5EEAD4',
  activeBg: 'rgba(13, 148, 136, 0.12)',
  hoverBg: 'rgba(255, 255, 255, 0.05)',
  brand: '#F8FAFC',
};

function NavIcon({ Icon, selected, dark }) {
  if (!Icon) return null;
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: 2,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        transition: 'all 180ms ease',
        ...(selected
          ? {
            background: dark ? BRAND_GRADIENT : ACTIVE_GRADIENT,
            boxShadow: dark
              ? '0 4px 12px rgba(13, 148, 136, 0.35)'
              : '0 4px 12px rgba(13, 148, 136, 0.28)',
            color: '#FFFFFF',
          }
          : {
            bgcolor: dark ? 'rgba(255,255,255,0.06)' : alpha('#64748B', 0.08),
            color: dark ? SUPER_ADMIN.muted : '#64748B',
          }),
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
  );
}

const Sidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, taskAlertsEnabled } = useSelector((state) => state.ui);
  // Submenus start collapsed; clicking a parent reveals its children.
  const [openMenus, setOpenMenus] = useState({});
  const [inboxUnread, setInboxUnread] = useState(0);
  const [assignedUnread, setAssignedUnread] = useState(0);
  const unreadHydrated = useRef(false);
  const lastInboxUnread = useRef(0);
  const lastAssignedUnread = useRef(0);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const { can } = useReceptionistPermissions();

  const isMenuPathAllowed = (path) => {
    if (path === '/conferences?tab=documents') return can('documents_view');
    if (path === '/conferences?tab=reports' || path === '/join-time-report') return can('reports_export');
    return true;
  };

  const isMenuItemAllowed = (item) => {
    if (item.section) return true;
    const pageKey = item.title === 'Conferences'
      ? 'conferences_page'
      : item.title === 'Tasks'
        ? 'tasks_page'
        : getReceptionistPageKeyForPath(item.path?.split('?')[0]);
    if (pageKey && !can(pageKey)) return false;
    return isMenuPathAllowed(item.path);
  };

  useEffect(() => {
    const loadInboxUnread = () => {
      api.get('/tasks/unread-count')
        .then(({ data }) => {
          const inboxCount = Number(data.inboxCount ?? data.count) || 0;
          const assignedCount = Number(data.assignedUpdateCount) || 0;
          if (taskAlertsEnabled && unreadHydrated.current && inboxCount > lastInboxUnread.current) {
            const added = inboxCount - lastInboxUnread.current;
            toast.info(added === 1
              ? 'A new task was assigned to you'
              : `${added} new tasks were assigned to you`);
          }
          if (taskAlertsEnabled && unreadHydrated.current && assignedCount > lastAssignedUnread.current) {
            const added = assignedCount - lastAssignedUnread.current;
            toast.info(added === 1
              ? 'A task you assigned was updated'
              : `${added} tasks you assigned were updated`);
          }
          unreadHydrated.current = true;
          lastInboxUnread.current = inboxCount;
          lastAssignedUnread.current = assignedCount;
          setInboxUnread(inboxCount);
          setAssignedUnread(assignedCount);
        })
        .catch(() => {});
    };

    loadInboxUnread();
    const timer = window.setInterval(loadInboxUnread, 12000);
    window.addEventListener('tasks:inbox-refresh', loadInboxUnread);
    window.addEventListener('notifications:refresh', loadInboxUnread);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('tasks:inbox-refresh', loadInboxUnread);
      window.removeEventListener('notifications:refresh', loadInboxUnread);
    };
  }, [taskAlertsEnabled]);

  const unreadBadge = (count) => (
    count > 0 ? (
      <Box
        component="span"
        sx={{
          minWidth: 20,
          height: 20,
          px: 0.6,
          ml: 1,
          borderRadius: 999,
          bgcolor: 'error.main',
          color: 'common.white',
          fontSize: '0.6875rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {count > 99 ? '99+' : count}
      </Box>
    ) : null
  );

  const menuLabel = (title, count = 0) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
      <Box component="span">{title}</Box>
      {unreadBadge(count)}
    </Box>
  );

  const menuItems = (MENU_CONFIG[user?.role] || [])
    .filter((item) => isMenuItemAllowed(item))
    .map((item) => (item.children
      ? { ...item, children: item.children.filter((child) => isMenuItemAllowed(child)) }
      : item));

  const handleToggle = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Sub-menu entries carry a query string (e.g. /conferences?tab=history), so
  // they only count as active when the whole URL matches.
  const isItemActive = (item) => (
    item.path?.includes('?')
      ? `${location.pathname}${location.search}` === item.path
      : location.pathname === item.path
  );

  const itemSx = (selected) => ({
    mx: 1.5,
    mb: 0.5,
    px: 1.25,
    py: 1,
    borderRadius: 2.5,
    transition: 'all 160ms ease',
    ...(isSuperAdmin ? {
      color: selected ? SUPER_ADMIN.activeText : SUPER_ADMIN.text,
      bgcolor: selected ? SUPER_ADMIN.activeBg : 'transparent',
      '&:hover': { bgcolor: selected ? SUPER_ADMIN.activeBg : SUPER_ADMIN.hoverBg },
    } : {
      color: selected ? 'primary.main' : 'text.primary',
      bgcolor: selected ? (theme) => alpha(theme.palette.primary.main, 0.07) : 'transparent',
      '&:hover': {
        bgcolor: selected
          ? (theme) => alpha(theme.palette.primary.main, 0.09)
          : (theme) => alpha(theme.palette.primary.main, 0.04),
      },
    }),
    '& .MuiListItemIcon-root': { minWidth: 42 },
    '& .MuiListItemText-primary': {
      fontWeight: selected ? 600 : 500,
      fontSize: '0.8125rem',
      lineHeight: 1.35,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
    },
  });

  const renderNavItem = (item, isChild = false) => {
    const selected = isItemActive(item);
    const Icon = ICON_MAP[item.icon] || Dashboard;

    return (
      <ListItemButton
        key={item.path + item.title}
        selected={selected && !isSuperAdmin}
        onClick={() => { navigate(item.path); onClose?.(); }}
        sx={{ ...itemSx(selected), ...(isChild && { pl: 2.5 }) }}
      >
        <ListItemIcon sx={{ minWidth: 42 }}>
          <NavIcon Icon={Icon} selected={selected} dark={isSuperAdmin} />
        </ListItemIcon>
        <ListItemText
          primary={menuLabel(
            item.title,
            item.path === '/tasks?tab=inbox'
              ? inboxUnread
              : item.path === '/tasks?tab=assigned'
                ? assignedUnread
                : 0
          )}
        />
      </ListItemButton>
    );
  };

  const drawerPaperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    borderRight: '1px solid',
    borderColor: isSuperAdmin ? SUPER_ADMIN.border : 'divider',
    bgcolor: isSuperAdmin ? SUPER_ADMIN.bg : '#FAFBFC',
    boxShadow: isSuperAdmin ? 'none' : '4px 0 24px rgba(15, 23, 42, 0.04)',
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isSuperAdmin ? SUPER_ADMIN.bg : '#FAFBFC',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: isSuperAdmin ? SUPER_ADMIN.header : 'background.paper',
          borderBottom: '1px solid',
          borderColor: isSuperAdmin ? SUPER_ADMIN.border : 'divider',
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            background: BRAND_GRADIENT,
            boxShadow: '0 6px 16px rgba(13, 148, 136, 0.35)',
            color: '#FFFFFF',
          }}
        >
          {isSuperAdmin ? <Shield sx={{ fontSize: 20 }} /> : <LocalHospital sx={{ fontSize: 20 }} />}
        </Box>
        <Typography
          noWrap
          sx={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            letterSpacing: '-0.01em',
            color: isSuperAdmin ? SUPER_ADMIN.brand : 'primary.main',
            minWidth: 0,
          }}
        >
          AMC Teleconference
        </Typography>
      </Box>

      <List sx={{ px: 0, py: 2, flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item, index) => {
          if (item.section) {
            return (
              <ListSubheader
                key={`section-${item.section}-${index}`}
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  color: isSuperAdmin ? SUPER_ADMIN.muted : 'text.disabled',
                  fontWeight: 700,
                  fontSize: '0.625rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  mt: index > 0 ? 2.5 : 0.5,
                  mb: 1,
                  px: 2.5,
                }}
              >
                {item.section}
              </ListSubheader>
            );
          }

          if (item.children) {
            const hasActiveChild = item.children.some(isItemActive);
            // Expand automatically while a child is active, unless the user
            // has explicitly toggled this group.
            const isOpen = openMenus[item.title] ?? hasActiveChild;
            const ParentIcon = ICON_MAP[item.icon] || Dashboard;
            return (
              <Box key={item.title}>
                <ListItemButton onClick={() => handleToggle(item.title)} sx={itemSx(hasActiveChild)}>
                  <ListItemIcon sx={{ minWidth: 42 }}>
                    <NavIcon Icon={ParentIcon} selected={hasActiveChild} dark={isSuperAdmin} />
                  </ListItemIcon>
                  <ListItemText primary={menuLabel(item.title, item.title === 'Tasks' ? inboxUnread + assignedUnread : 0)} />
                  {isOpen
                    ? <ExpandLess sx={{ fontSize: 18, color: isSuperAdmin ? SUPER_ADMIN.muted : 'text.disabled' }} />
                    : <ExpandMore sx={{ fontSize: 18, color: isSuperAdmin ? SUPER_ADMIN.muted : 'text.disabled' }} />}
                </ListItemButton>
                <Collapse in={isOpen}>
                  <List component="div" disablePadding>
                    {item.children.map((child) => renderNavItem(child, true))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          return renderNavItem(item);
        })}
      </List>

      <Box
        sx={{
          height: 3,
          mx: 2,
          mb: 2,
          borderRadius: 2,
          background: isSuperAdmin
            ? BRAND_GRADIENT
            : `linear-gradient(90deg, ${alpha('#0F766E', 0.12)}, ${alpha('#0D9488', 0.22)})`,
          flexShrink: 0,
        }}
      />
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': drawerPaperSx }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: sidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflowX: 'hidden',
          '& .MuiDrawer-paper': drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
