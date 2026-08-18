import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

/**
 * Resolves whether the signed-in user may edit or delete records.
 * Receptionists are additionally gated by admin-controlled system settings;
 * every other role keeps the access granted by its route permissions.
 */
const useRolePermissions = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const canEditSetting = useSelector((state) => state.settings.receptionist_can_edit);
  const canDeleteSetting = useSelector((state) => state.settings.receptionist_can_delete);

  const isReceptionist = role === ROLES.RECEPTIONIST;

  return {
    isReceptionist,
    canEdit: isReceptionist ? canEditSetting !== false : true,
    canDelete: isReceptionist ? canDeleteSetting !== false : true,
  };
};

export default useRolePermissions;
