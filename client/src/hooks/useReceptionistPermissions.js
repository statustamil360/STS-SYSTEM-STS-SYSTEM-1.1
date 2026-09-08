import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';
import { normalizeReceptionistPermissions } from '../utils/receptionistPermissions';

/**
 * Reads the per-receptionist permission flags the admin set on the account.
 * Every other role is unrestricted here — their access comes from route roles.
 */
const useReceptionistPermissions = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const permissions = useSelector((state) => state.auth.user?.permissions);

  const isReceptionist = role === ROLES.RECEPTIONIST;
  const normalized = isReceptionist ? normalizeReceptionistPermissions(permissions) : null;

  const can = (permissionKey) => {
    if (!isReceptionist) return true;
    return normalized[permissionKey] === true;
  };

  return { isReceptionist, can };
};

export default useReceptionistPermissions;
