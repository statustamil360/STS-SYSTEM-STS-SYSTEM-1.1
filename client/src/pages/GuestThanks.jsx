import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { CheckCircleOutlined } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

const GuestThanks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDone = () => {
    dispatch(logout());
    navigate('/guest-conference', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper elevation={0} sx={{ p: 4, maxWidth: 480, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CheckCircleOutlined color="success" sx={{ fontSize: 64, mb: 1 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Thanks for Joining!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          You have left the meeting. You may close this window or return to the guest login.
        </Typography>
        <Stack direction="row" justifyContent="center">
          <Button variant="contained" onClick={handleDone}>
            Done
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default GuestThanks;
