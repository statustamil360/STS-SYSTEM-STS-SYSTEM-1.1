import {
  Box, Typography, Stack, TextField, Grid, InputAdornment, MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Controller } from 'react-hook-form';
import {
  getFieldPlaceholder,
  selectMenuSlotProps,
  SELECT_PLACEHOLDER,
} from '../utils/fieldPlaceholders';
import { PasswordRevealAdornment, usePasswordReveal } from './PasswordReveal';

export { SELECT_PLACEHOLDER, selectMenuSlotProps } from '../utils/fieldPlaceholders';

export const SelectPlaceholderMenuItem = () => (
  <MenuItem value="">
    <Typography component="span" variant="body2" color="text.secondary">
      -- Select --
    </Typography>
  </MenuItem>
);

export const renderSelectPlaceholder = () => (
  <Typography component="span" variant="body2" color="text.secondary">
    -- Select --
  </Typography>
);

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '9999px',
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
    color: 'text.secondary',
    bgcolor: 'background.paper',
    px: 0.5,
    mx: 0.5,
  },
  '& .MuiInputLabel-shrink': {
    bgcolor: 'background.paper',
    fontWeight: 600,
    color: 'primary.main',
  },
  '& .MuiFormHelperText-root': {
    mx: 2,
    fontSize: '0.75rem',
  },
  '& .MuiInputLabel-asterisk': {
    color: 'error.main',
    fontWeight: 700,
  },
};

export const multilineFieldSx = {
  ...fieldSx,
  '& .MuiOutlinedInput-root': {
    ...fieldSx['& .MuiOutlinedInput-root'],
    borderRadius: 3,
    minHeight: 'auto',
    alignItems: 'flex-start',
    py: 0.5,
  },
};

export const dialogPaperSx = {
  borderRadius: 3,
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(15, 23, 42, 0.18)',
};

export const dialogContentSx = {
  px: { xs: 2, sm: 3 },
  py: 2.5,
  flex: '1 1 auto',
  overflowY: 'auto',
  bgcolor: 'background.default',
};

export const handleFormDialogClose = (closeFn, submitting = false) => (event, reason) => {
  if (submitting) return;
  if (reason === 'backdropClick') return;
  closeFn();
};

export const PremiumDialogHeader = ({ icon: Icon, title, subtitle }) => (
  <Box
    sx={{
      px: 3,
      py: 2.5,
      flexShrink: 0,
      background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.primary.light} 100%)`,
      color: 'common.white',
    }}
  >
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha('#FFFFFF', 0.15),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.25, opacity: 0.85 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  </Box>
);

export const SectionCard = ({ title, icon: Icon, children }) => (
  <Box
    sx={{
      mb: 2.5,
      p: { xs: 2.5, sm: 3 },
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: alpha('#64748B', 0.18),
      bgcolor: 'background.paper',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    }}
  >
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, letterSpacing: '0.01em', color: 'text.primary', fontSize: '0.9375rem' }}
      >
        {title}
      </Typography>
    </Stack>
    <Grid container spacing={2.5}>{children}</Grid>
  </Box>
);

const normalizeSelectValue = (raw) => {
  if (raw === undefined || raw === null || raw === '') return '';
  return String(raw);
};

const SelectFieldCore = ({
  label,
  name,
  options,
  icon: Icon,
  error,
  helperText,
  children,
  value,
  onChange,
  onBlur,
  inputRef,
  required = false,
  showSelectPlaceholder,
  disabled = false,
}) => {
  const enablePlaceholder = showSelectPlaceholder !== false;
  const selectValue = normalizeSelectValue(value);

  const normalizedOptions = options?.map((opt) => ({
    value: String(opt.value),
    label: opt.label,
  }));

  const menuItems = children || [
    ...(enablePlaceholder
      ? [
        <MenuItem key="__placeholder__" value="">
          <Typography component="span" variant="body2" color="text.secondary">
            {SELECT_PLACEHOLDER}
          </Typography>
        </MenuItem>,
      ]
      : []),
    ...(normalizedOptions?.map((opt) => (
      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
    )) ?? []),
  ];

  return (
    <TextField
      fullWidth
      size="small"
      select
      id={name}
      name={name}
      label={label}
      value={selectValue}
      onChange={(event) => onChange?.(event.target.value)}
      onBlur={onBlur}
      inputRef={inputRef}
      required={required}
      error={error}
      helperText={helperText}
      disabled={disabled}
      sx={fieldSx}
      slotProps={{
        inputLabel: { shrink: true },
        input: Icon ? {
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 0.5, pointerEvents: 'none' }}>
              <Icon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
            </InputAdornment>
          ),
        } : undefined,
        select: {
          displayEmpty: enablePlaceholder,
          MenuProps: selectMenuSlotProps,
          renderValue: enablePlaceholder
            ? (selected) => {
              const isEmpty = selected === '' || selected === undefined || selected === null;
              if (isEmpty) return SELECT_PLACEHOLDER;
              if (normalizedOptions?.length) {
                const match = normalizedOptions.find((opt) => opt.value === String(selected));
                if (match) return match.label;
              }
              return selected;
            }
            : undefined,
        },
      }}
    >
      {menuItems}
    </TextField>
  );
};

const TextFieldCore = ({
  label,
  name,
  register,
  registerOptions,
  type,
  multiline,
  rows,
  shrink,
  defaultValue,
  icon: Icon,
  error,
  helperText,
  readOnly,
  endAdornment,
  required = false,
  placeholder,
  disabled = false,
}) => {
  const registerProps = register && name ? register(name, registerOptions) : { name };
  const isMultiline = Boolean(multiline);
  const isRequired = required || Boolean(registerOptions?.required);
  const resolvedPlaceholder = placeholder ?? getFieldPlaceholder(name, { type, label });
  const isPassword = type === 'password';
  const reveal = usePasswordReveal(defaultValue);

  const handleChange = (event) => {
    if (isPassword) reveal.onValueChange(event.target.value);
    registerProps.onChange?.(event);
  };

  const passwordEndAdornment = isPassword
    ? (
      <PasswordRevealAdornment
        hasValue={reveal.hasValue}
        visible={reveal.visible}
        onToggle={() => reveal.setVisible((prev) => !prev)}
        extra={endAdornment}
      />
    )
    : endAdornment;

  return (
    <TextField
      fullWidth
      size="small"
      label={label}
      type={isPassword ? (reveal.visible ? 'text' : 'password') : (type || 'text')}
      multiline={multiline}
      rows={rows}
      defaultValue={defaultValue}
      required={isRequired}
      error={error}
      helperText={helperText}
      placeholder={resolvedPlaceholder}
      disabled={disabled}
      {...registerProps}
      onChange={handleChange}
      sx={isMultiline ? multilineFieldSx : fieldSx}
      slotProps={{
        inputLabel: (shrink || type === 'date' || type === 'time') ? { shrink: true } : undefined,
        input: {
          readOnly,
          startAdornment: Icon ? (
            <InputAdornment position="start" sx={{ ml: 0.5, pointerEvents: 'none' }}>
              <Icon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
            </InputAdornment>
          ) : undefined,
          endAdornment: passwordEndAdornment,
        },
      }}
    />
  );
};

export const IconField = ({
  label,
  name,
  register,
  registerOptions,
  control,
  type,
  multiline,
  rows,
  select,
  options,
  shrink,
  defaultValue,
  icon,
  error,
  helperText,
  children,
  readOnly,
  value,
  onChange,
  onBlur,
  inputRef,
  endAdornment,
  required = false,
  placeholder,
  showSelectPlaceholder,
  disabled = false,
}) => {
  const isRequired = required || Boolean(registerOptions?.required);

  if (select) {
    const sharedSelectProps = {
      label,
      name,
      options,
      icon,
      error,
      helperText,
      children,
      required: isRequired,
      showSelectPlaceholder,
      disabled,
    };

    if (value !== undefined && onChange) {
      return (
        <SelectFieldCore
          {...sharedSelectProps}
          value={value}
          onChange={(nextValue) => onChange({ target: { value: nextValue, name } })}
          onBlur={onBlur}
          inputRef={inputRef}
        />
      );
    }

    if (name && control) {
      return (
        <Controller
          name={name}
          control={control}
          rules={registerOptions}
          render={({ field, fieldState }) => (
            <SelectFieldCore
              {...sharedSelectProps}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={error ?? !!fieldState.error}
              helperText={helperText ?? fieldState.error?.message}
            />
          )}
        />
      );
    }

    return null;
  }

  return (
    <TextFieldCore
      label={label}
      name={name}
      register={register}
      registerOptions={registerOptions}
      type={type}
      multiline={multiline}
      rows={rows}
      shrink={shrink}
      defaultValue={defaultValue}
      icon={icon}
      error={error}
      helperText={helperText}
      readOnly={readOnly}
      endAdornment={endAdornment}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};
