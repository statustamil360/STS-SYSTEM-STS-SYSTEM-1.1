import { Box, Container } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { PageRefreshProvider } from '../context/PageRefreshContext';
import FloatingCalendarButton from '../components/FloatingCalendarButton';
import TodayConferencesPopup from '../components/TodayConferencesPopup';
import { ConferenceSessionProvider } from '../context/ConferenceSessionContext';
import PersistentConferenceMedia from '../components/PersistentConferenceMedia';

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error('You do not have permission to access that page.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <PageRefreshProvider>
      <ConferenceSessionProvider>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header onMobileMenuOpen={() => setMobileOpen(true)} />
            <Container
              maxWidth="xl"
              sx={{
                flex: 1,
                py: { xs: 2, md: 3 },
                px: { xs: 2, md: 3 },
              }}
            >
              <Outlet />
            </Container>
            <FloatingCalendarButton />
            <TodayConferencesPopup />
            <PersistentConferenceMedia />
          </Box>
        </Box>
      </ConferenceSessionProvider>
    </PageRefreshProvider>
  );
};

export default MainLayout;
