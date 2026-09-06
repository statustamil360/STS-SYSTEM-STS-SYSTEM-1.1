import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';
import useReceptionistPermissions from './useReceptionistPermissions';

/**
 * Whether the signed-in user may download conference documents.
 * GP and AHP are gated by admin-controlled settings (default: view only);
 * receptionists are gated by the permissions set on their own account.
 */
const useDocumentDownloadAccess = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const gpCanDownload = useSelector((state) => state.settings.gp_can_download_documents);
  const ahpCanDownload = useSelector((state) => state.settings.ahp_can_download_documents);
  const { can } = useReceptionistPermissions();

  if (role === ROLES.GP) return gpCanDownload === true;
  if (role === ROLES.AHP) return ahpCanDownload === true;
  if (role === ROLES.RECEPTIONIST) return can('documents_download');
  return true;
};

export default useDocumentDownloadAccess;
