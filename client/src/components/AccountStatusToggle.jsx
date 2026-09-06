import { Box, FormHelperText, Stack, Switch, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Controller } from 'react-hook-form';

/**
 * Active / inactive as an ON/OFF switch. `disabled` still displays as OFF
 * and flipping ON sets the account back to active.
 */
export const AccountStatusSwitch = ({
  value = 'active',
  onChange,
  disabled = false,
  error = false,
  helperText,
}) => {
  const isOn = value === 'active';

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.25,
          borderRadius: '9999px',
          border: '1px solid',
          borderColor: (theme) => (error
            ? theme.palette.error.main
            : alpha(isOn ? theme.palette.success.main : '#64748B', isOn ? 0.45 : 0.28)),
          bgcolor: (theme) => alpha(isOn ? theme.palette.success.main : '#64748B', isOn ? 0.08 : 0.04),
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {isOn ? 'Active' : value === 'disabled' ? 'Disabled' : 'Inactive'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isOn ? 'This account can sign in' : 'This account cannot sign in'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: isOn ? 'text.disabled' : 'error.main',
            }}
          >
            OFF
          </Typography>
          <Switch
            checked={isOn}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked ? 'active' : 'inactive')}
            color="success"
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: isOn ? 'success.main' : 'text.disabled',
            }}
          >
            ON
          </Typography>
        </Stack>
      </Stack>
      {helperText && (
        <FormHelperText error={error} sx={{ mx: 2, mt: 0.5 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

const AccountStatusToggle = ({
  name = 'status',
  control,
  disabled = false,
  error = false,
  helperText,
}) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => (
      <AccountStatusSwitch
        value={field.value || 'active'}
        onChange={field.onChange}
        disabled={disabled}
        error={error || !!fieldState.error}
        helperText={helperText ?? fieldState.error?.message}
      />
    )}
  />
);

export default AccountStatusToggle;
