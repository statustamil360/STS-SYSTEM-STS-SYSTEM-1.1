import {
  Dialog, DialogContent, DialogActions, Button, Typography, Box, Stack, alpha,
} from '@mui/material';
import { DeleteOutlined, WarningAmberOutlined, InfoOutlined } from '@mui/icons-material';

const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message,
  subject,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const isDestructive = confirmColor === 'error';
  const HeaderIcon = isDestructive ? DeleteOutlined : InfoOutlined;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)',
          },
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          color: 'common.white',
          background: (theme) => (isDestructive
            ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
            : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`),
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#FFFFFF', 0.18),
            }}
          >
            <HeaderIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.9 }}>
              {isDestructive ? 'This action cannot be undone' : 'Please confirm to continue'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 3, pt: 3, pb: 2.5 }}>
        {subject && (
          <Box
            sx={{
              mb: 2,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: isDestructive ? 'error.light' : 'divider',
              bgcolor: (theme) => alpha(isDestructive ? theme.palette.error.main : theme.palette.primary.main, 0.06),
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDestructive ? 'error.dark' : 'primary.main' }}>
              {subject}
            </Typography>
          </Box>
        )}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          {isDestructive && (
            <WarningAmberOutlined sx={{ fontSize: 20, color: 'warning.main', mt: 0.15, flexShrink: 0 }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {message}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          gap: 1,
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onCancel}
          color="inherit"
          disabled={loading}
          sx={{ px: 2.5, borderRadius: 2, fontWeight: 600 }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
          sx={{
            px: 3,
            borderRadius: 2,
            fontWeight: 600,
            boxShadow: isDestructive ? '0 8px 20px rgba(220, 38, 38, 0.28)' : '0 8px 20px rgba(30, 58, 95, 0.22)',
            '&:hover': {
              boxShadow: isDestructive ? '0 10px 24px rgba(220, 38, 38, 0.34)' : '0 10px 24px rgba(30, 58, 95, 0.28)',
            },
          }}
        >
          {loading ? 'Please wait...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
