import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, TextField, Button, Typography, Alert, InputAdornment, IconButton,
  CircularProgress, Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  MailOutlined, LockOutlined, VisibilityOutlined, VisibilityOffOutlined, LoginOutlined,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, clearError, clearSession } from '../redux/slices/authSlice';
import { getRoleHomePath } from '../utils/constants';

const schema = yup.object({
  email: yup.string().email('Enter a valid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    bgcolor: 'background.default',
    fontSize: '0.9375rem',
    minHeight: 48,
    transition: 'box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease',
    '& fieldset': { borderColor: alpha('#64748B', 0.28) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.45) },
    '&.Mui-focused': {
      bgcolor: 'background.paper',
      boxShadow: '0 0 0 4px rgba(30, 58, 95, 0.08)',
    },
  },
  '& .MuiInputLabel-root': { fontSize: '0.875rem', fontWeight: 500 },
  '& .MuiInputLabel-asterisk': { color: 'error.main', fontWeight: 700 },
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = location.state?.sessionExpired;
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    dispatch(clearSession());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(getRoleHomePath(user.role), { replace: true });
    }
    return () => dispatch(clearError());
  }, [isAuthenticated, user, navigate, dispatch]);

  const onSubmit = (data) => {
    dispatch(login(data))
      .unwrap()
      .then((loggedInUser) => {
        navigate(getRoleHomePath(loggedInUser.role), { replace: true });
      })
      .catch(() => {});
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.75 }}>
        Sign in
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Enter your credentials to access your AMC workspace.
      </Typography>

      {sessionExpired && !error && (
        <Alert severity="warning" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          Your session expired. Please sign in again.
        </Alert>
      )}

      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2.25}>
        <TextField
          fullWidth
          required
          label="Email address"
          placeholder="you@amc.com"
          autoComplete="email"
          autoFocus
          sx={fieldSx}
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          fullWidth
          required
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          autoComplete="current-password"
          sx={fieldSx}
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.85 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <VisibilityOffOutlined sx={{ fontSize: 20 }} />
                      : <VisibilityOutlined sx={{ fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Button
        fullWidth
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        startIcon={!loading && <LoginOutlined />}
        sx={{
          mt: 3,
          py: 1.35,
          borderRadius: 2.5,
          fontWeight: 700,
          fontSize: '0.9375rem',
          boxShadow: '0 10px 24px rgba(30, 58, 95, 0.22)',
          '&:hover': { boxShadow: '0 12px 28px rgba(30, 58, 95, 0.28)' },
        }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 3, lineHeight: 1.5 }}
      >
        Accounts are issued by your administrator.
      </Typography>
    </Box>
  );
};

export default Login;
