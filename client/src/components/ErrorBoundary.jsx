import { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { RefreshOutlined, HomeOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.assign(`${window.location.pathname}${window.location.search || ''}`);
  };

  handleGoHome = () => {
    window.location.assign('/dashboard');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 480,
            width: '100%',
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The page crashed unexpectedly. Try reloading, or return to the dashboard.
          </Typography>
          {import.meta.env.DEV && this.state.error && (
            <Typography
              variant="caption"
              component="pre"
              sx={{
                display: 'block',
                textAlign: 'left',
                bgcolor: 'action.hover',
                p: 1.5,
                borderRadius: 1,
                mb: 3,
                overflow: 'auto',
                maxHeight: 120,
              }}
            >
              {this.state.error.message}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
            <Button variant="contained" startIcon={<RefreshOutlined />} onClick={this.handleReload}>
              Reload page
            </Button>
            <Button variant="outlined" startIcon={<HomeOutlined />} onClick={this.handleGoHome}>
              Go to dashboard
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }
}

export const RouteErrorBoundary = ({ children }) => {
  const location = useLocation();
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>;
};

export default ErrorBoundary;
