import { Box, Stack, Typography, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LocalHospitalOutlined } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';

const BrandOverlay = () => (
  <Stack
    spacing={2}
    sx={{
      position: 'relative',
      zIndex: 2,
      alignItems: 'center',
      textAlign: 'center',
      px: 3,
    }}
  >
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: alpha('#FFFFFF', 0.14),
        border: '2px solid',
        borderColor: alpha('#FFFFFF', 0.35),
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}
    >
      <LocalHospitalOutlined sx={{ fontSize: 36, color: 'common.white' }} />
    </Box>
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          color: 'common.white',
          textShadow: '0 2px 16px rgba(0,0,0,0.35)',
        }}
      >
        AMC Teleconference
      </Typography>
      <Typography
        variant="body2"
        sx={{
          mt: 0.75,
          color: alpha('#FFFFFF', 0.82),
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.6875rem',
        }}
      >
        Healthcare Management System
      </Typography>
    </Box>
  </Stack>
);

const AuthLayout = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: { xs: 2, sm: 3 },
      py: { xs: 3, sm: 4 },
      bgcolor: (theme) => alpha(theme.palette.primary.dark, 0.04),
      backgroundImage: (theme) => `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 45%),
        radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.main, 0.06)} 0%, transparent 40%)`,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 920,
        overflow: 'hidden',
        borderRadius: { xs: 3, sm: 4 },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 24px 64px rgba(15, 23, 42, 0.14)',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: { xs: 'auto', md: 560 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: { xs: '0 0 auto', md: '0 0 42%' },
          minHeight: { xs: 220, sm: 260, md: 'auto' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundImage: 'url(/login-hero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(11, 30, 54, 0.55) 0%, rgba(11, 30, 54, 0.82) 100%)',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <BrandOverlay />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          px: { xs: 3, sm: 4, md: 5 },
          py: { xs: 4, sm: 5 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 360 }}>
          <Outlet />
        </Box>
      </Box>
    </Paper>
  </Box>
);

export default AuthLayout;
