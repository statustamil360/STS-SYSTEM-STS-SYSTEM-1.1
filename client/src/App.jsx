import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './redux/store';
import getTheme from './theme';
import AppRoutes from './routes/AppRoutes';
import SessionGuard from './components/SessionGuard';
import { fetchProfile } from './redux/slices/authSlice';
import { fetchSystemSettings } from './redux/slices/settingsSlice';
import { setDarkMode, hydrateCalendarPopup, hydrateDashboardPrefs } from './redux/slices/uiSlice';
import { canRoleUseDarkMode } from './hooks/useDarkModeAccess';

const ThemedApp = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const settings = useSelector((state) => state.settings);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
      dispatch(fetchSystemSettings());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      dispatch(hydrateCalendarPopup(user.id));
      dispatch(hydrateDashboardPrefs(user.id));
    }
  }, [dispatch, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user || !settings.loaded) return;
    const allowed = canRoleUseDarkMode(user.role, settings);
    if (!allowed && darkMode) {
      dispatch(setDarkMode(false));
    }
  }, [dispatch, isAuthenticated, user, settings, darkMode]);

  useEffect(() => {
    if (!isAuthenticated || !user) return undefined;

    const verifySession = () => {
      dispatch(fetchProfile({ silent: true }));
    };

    const timer = setInterval(verifySession, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') verifySession();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [dispatch, isAuthenticated, user]);

  return (
    <ThemeProvider theme={getTheme(darkMode ? 'dark' : 'light')}>
      <CssBaseline />
      <BrowserRouter>
        <SessionGuard />
        <AppRoutes />
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? 'dark' : 'light'} />
    </ThemeProvider>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  );
}

export default App;
