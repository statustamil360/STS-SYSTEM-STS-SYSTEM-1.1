import { useEffect, useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';

/**
 * Eye icon appears only after the field has text. Clearing the field hides it again.
 */
export const usePasswordReveal = (initialValue = '') => {
  const [hasValue, setHasValue] = useState(Boolean(String(initialValue || '')));
  const [visible, setVisible] = useState(false);

  const onValueChange = (value) => {
    const filled = Boolean(String(value ?? ''));
    setHasValue(filled);
    if (!filled) setVisible(false);
  };

  return {
    hasValue,
    visible,
    setVisible,
    onValueChange,
    inputType: visible ? 'text' : 'password',
  };
};

export const PasswordRevealAdornment = ({ hasValue, visible, onToggle, extra }) => {
  if (!hasValue && !extra) return null;
  return (
    <InputAdornment position="end">
      {hasValue && (
        <IconButton
          onClick={onToggle}
          edge="end"
          size="small"
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible
            ? <VisibilityOffOutlined sx={{ fontSize: 20 }} />
            : <VisibilityOutlined sx={{ fontSize: 20 }} />}
        </IconButton>
      )}
      {extra}
    </InputAdornment>
  );
};

/** Drop-in TextField that reveals the eye icon once the user starts typing. */
const PasswordTextField = ({
  value,
  defaultValue,
  onChange,
  slotProps,
  type: _type,
  ...props
}) => {
  const reveal = usePasswordReveal(value ?? defaultValue ?? '');
  const extraEnd = slotProps?.input?.endAdornment;

  useEffect(() => {
    if (value !== undefined) reveal.onValueChange(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync only when the controlled value changes
  }, [value]);

  const handleChange = (event) => {
    reveal.onValueChange(event.target.value);
    onChange?.(event);
  };

  return (
    <TextField
      {...props}
      type={reveal.inputType}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      slotProps={{
        ...slotProps,
        input: {
          ...slotProps?.input,
          endAdornment: (
            <PasswordRevealAdornment
              hasValue={reveal.hasValue}
              visible={reveal.visible}
              onToggle={() => reveal.setVisible((prev) => !prev)}
              extra={extraEnd}
            />
          ),
        },
      }}
    />
  );
};

export default PasswordTextField;
