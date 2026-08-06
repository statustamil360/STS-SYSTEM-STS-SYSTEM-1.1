import { Box, Typography, Stack, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const premiumPaperSx = {
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
};

export const adminFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.paper',
    fontSize: '0.875rem',
    minHeight: 44,
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
    '& fieldset': { borderColor: alpha('#64748B', 0.28) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.45) },
    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(30, 58, 95, 0.08)' },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  '& .MuiInputLabel-asterisk': {
    color: 'error.main',
    fontWeight: 700,
  },
};

export const PremiumPageHeader = ({ icon: Icon, title, subtitle, action }) => (
  <Box
    sx={{
      px: { xs: 2, sm: 2.5 },
      py: 2.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
      background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
    }}
  >
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  </Box>
);

export const PremiumSection = ({ icon: Icon, title, subtitle, children, accent = 'primary' }) => (
  <Box
    sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: alpha('#64748B', 0.18),
      bgcolor: 'background.paper',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    }}
  >
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette[accent]?.main || theme.palette.primary.main, 0.08),
          color: `${accent}.main`,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    {children}
  </Box>
);

export const PremiumPageCard = ({ icon, title, subtitle, action, children }) => (
  <Paper elevation={0} sx={premiumPaperSx}>
    <PremiumPageHeader icon={icon} title={title} subtitle={subtitle} action={action} />
    <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
  </Paper>
);

export const premiumButtonSx = {
  px: 3,
  py: 1,
  borderRadius: 2,
  fontWeight: 600,
  boxShadow: '0 6px 16px rgba(30, 58, 95, 0.2)',
  '&:hover': { boxShadow: '0 8px 20px rgba(30, 58, 95, 0.26)' },
};

export const emptyStateSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 280,
  borderRadius: 2.5,
  border: '1px dashed',
  borderColor: alpha('#64748B', 0.25),
  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
  p: 4,
  textAlign: 'center',
};
