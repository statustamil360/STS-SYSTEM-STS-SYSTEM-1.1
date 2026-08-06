import { DialogActions, Button } from '@mui/material';

const FormDialogActions = ({
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  submitType = 'submit',
}) => (
  <DialogActions
    sx={{
      px: 3,
      py: 2,
      gap: 1,
      flexShrink: 0,
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
      type={submitType}
      variant="contained"
      disabled={loading}
      sx={{
        px: 3,
        borderRadius: 2,
        fontWeight: 600,
        boxShadow: '0 8px 20px rgba(30, 58, 95, 0.22)',
        '&:hover': { boxShadow: '0 10px 24px rgba(30, 58, 95, 0.28)' },
      }}
    >
      {loading ? 'Saving...' : submitLabel}
    </Button>
  </DialogActions>
);

export default FormDialogActions;
