import { Box, Typography, Button, Stack } from '@mui/material';
import { Add } from '@mui/icons-material';

const PageHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon = Add, children }) => (
  <Box
    sx={{
      mb: 3,
      pb: 2.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
    >
      <Box>
        <Typography
          variant="h5"
          color="text.primary"
          sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        {children}
        {actionLabel && onAction && (
          <Button variant="contained" startIcon={<ActionIcon />} onClick={onAction} size="medium">
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Stack>
  </Box>
);

export default PageHeader;
