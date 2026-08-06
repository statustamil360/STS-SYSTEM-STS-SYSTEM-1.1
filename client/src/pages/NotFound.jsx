import { Box, Typography, Button, Stack } from '@mui/material';
import { HomeOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', py: 10, px: 2 }}>
      <Typography variant="h1" color="primary" sx={{ fontWeight: 700, fontSize: '5rem', lineHeight: 1, mb: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
        The page you are looking for does not exist or may have been moved.
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
        <Button variant="contained" startIcon={<HomeOutlined />} onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound;
