import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { clearSession } from '../redux/slices/authSlice';
import { SESSION_EXPIRED_EVENT } from '../utils/sessionEvents';

const SessionGuard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleSessionExpired = (event) => {
      const deactivated = event.detail?.deactivated;
      dispatch(clearSession());
      if (deactivated) {
        toast.warning('Your account has been deactivated.');
        navigate('/login?deactivated=1', { replace: true });
      } else {
        toast.info('Your session expired. Please sign in again.');
        navigate('/login', { replace: true, state: { sessionExpired: true } });
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [dispatch, navigate]);

  return null;
};

export default SessionGuard;
