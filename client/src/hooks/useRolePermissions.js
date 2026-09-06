import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';
import useReceptionistPermissions from './useReceptionistPermissions';

/**
 * Resolves whether the signed-in user may add, edit or delete records.
 * Receptionists are gated by admin-controlled system settings and, when a
 * `resource` is given (patients, appointments, tasks, gps, ahps), by the
 * per-account permissions set on their receptionist profile.
 * Every other role keeps the access granted by its route permissions.
 */
const useRolePermissions = (resource) => {
  const role = useSelector((state) => state.auth.user?.role);
  const canEditSetting = useSelector((state) => state.settings.receptionist_can_edit);
  const canDeleteSetting = useSelector((state) => state.settings.receptionist_can_delete);
  const { can } = useReceptionistPermissions();

  const isReceptionist = role === ROLES.RECEPTIONIST;
  const allowedFor = (action) => (resource ? can(`${resource}_${action}`) : true);

  return {
    isReceptionist,
    canCreate: isReceptionist ? allowedFor('create') : true,
    canEdit: isReceptionist ? canEditSetting !== false && allowedFor('edit') : true,
    canDelete: isReceptionist ? canDeleteSetting !== false && allowedFor('delete') : true,
  };
};

export default useRolePermissions;
