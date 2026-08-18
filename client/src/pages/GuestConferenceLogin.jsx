import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, Stack, Alert, CircularProgress,
} from '@mui/material';
import { LoginOutlined, VideoCallOutlined } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice';
import api from '../services/api';

const GuestConferenceLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const code = searchParams.get('code') || '';

  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(!!code);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoadingInfo(true);
    api.get('/conferences/guest/info', { params: { access_code: code } })
      .then(({ data }) => {
        setInfo(data.data);
        setEmail(data.data.guestEmail || '');
      })
      .catch(() => setError('Invalid or expired guest access code'))
      .finally(() => setLoadingInfo(false));
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const user = await dispatch(login({ email, password })).unwrap();
      if (user.role !== 'conference_guest') {
        setError('This login is not a guest conference account');
        return;
      }
      navigate(`/conferences/${info.conferenceId}/room`, { replace: true });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInfo) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', py: 6, px: 2 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <VideoCallOutlined color="primary" />
          <Typography variant="h6" fontWeight={700}>Guest Conference Access</Typography>
        </Stack>

        {info && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Joining <strong>{info.conferenceCode}</strong> as <strong>{info.guestName}</strong>
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Temporary password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting || !info}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LoginOutlined />}
            >
              Join Conference
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default GuestConferenceLogin;
