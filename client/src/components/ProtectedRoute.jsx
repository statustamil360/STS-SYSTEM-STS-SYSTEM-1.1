import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ROLE_HOME_PATHS, ROLES } from '../utils/constants';
import { getReceptionistPageKeyForPath } from '../utils/receptionistPermissions';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, profileLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileLoading && !user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={36} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          Loading your session...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ sessionExpired: true, from: location.pathname }} />;
  }

  if (user.status && user.status !== 'active') {
    return <Navigate to="/login?deactivated=1" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME_PATHS[user.role] || '/dashboard';
    return (
      <Navigate
        to={home}
        replace
        state={{ unauthorized: true, from: location.pathname }}
      />
    );
  }

  if (user.role === ROLES.RECEPTIONIST) {
    const pageKey = getReceptionistPageKeyForPath(location.pathname);
    if (pageKey && user.permissions?.[pageKey] === false) {
      return <Navigate to={ROLE_HOME_PATHS[ROLES.RECEPTIONIST]} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
