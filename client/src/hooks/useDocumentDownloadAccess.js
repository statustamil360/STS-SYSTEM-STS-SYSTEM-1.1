import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';

/**
 * Whether the signed-in user may download conference documents.
 * GP and AHP are gated by admin-controlled settings (default: view only).
 */
const useDocumentDownloadAccess = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const gpCanDownload = useSelector((state) => state.settings.gp_can_download_documents);
  const ahpCanDownload = useSelector((state) => state.settings.ahp_can_download_documents);

  if (role === ROLES.GP) return gpCanDownload === true;
  if (role === ROLES.AHP) return ahpCanDownload === true;
  return true;
};

export default useDocumentDownloadAccess;
