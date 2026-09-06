import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

/**
 * Reads the per-receptionist permission flags the admin set on the account.
 * Every other role is unrestricted here — their access comes from route roles.
 */
const useReceptionistPermissions = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const permissions = useSelector((state) => state.auth.user?.permissions);

  const isReceptionist = role === ROLES.RECEPTIONIST;

  const can = (permissionKey) => {
    if (!isReceptionist) return true;
    return permissions?.[permissionKey] !== false;
  };

  return { isReceptionist, can };
};

export default useReceptionistPermissions;
