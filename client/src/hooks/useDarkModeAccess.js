import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

export const canRoleUseDarkMode = (role, settings = {}) => {
  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role)) return true;
  if (settings.dark_mode_allowed === false) return false;

  const roleMap = {
    [ROLES.RECEPTIONIST]: settings.receptionist_dark_mode_allowed,
    [ROLES.GP]: settings.gp_dark_mode_allowed,
    [ROLES.AHP]: settings.ahp_dark_mode_allowed,
  };

  return roleMap[role] !== false;
};

const useDarkModeAccess = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const settings = useSelector((state) => state.settings);
  return canRoleUseDarkMode(role, settings);
};

export default useDarkModeAccess;
