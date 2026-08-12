import { createTheme, alpha } from '@mui/material/styles';

const BRAND = {
  navy: '#1E3A5F',
  navyLight: '#2E5984',
  navyDark: '#0F2744',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealDark: '#0F766E',
  slate: '#64748B',
  surface: '#F8FAFC',
};

const getTheme = (mode = 'light') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: { main: BRAND.teal, light: BRAND.tealLight, dark: BRAND.tealDark, contrastText: '#FFFFFF' },
      secondary: { main: BRAND.navy, light: BRAND.navyLight, dark: BRAND.navyDark, contrastText: '#FFFFFF' },
      background: {
        default: isLight ? '#F1F5F9' : '#0B1120',
        paper: isLight ? '#FFFFFF' : '#151E2E',
      },
      success: { main: '#059669', light: '#10B981', dark: '#047857' },
      warning: { main: '#D97706', light: '#F59E0B', dark: '#B45309' },
      error: { main: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
      info: { main: '#0284C7', light: '#0EA5E9', dark: '#0369A1' },
      divider: isLight ? '#E2E8F0' : '#1E293B',
      text: {
        primary: isLight ? '#0F172A' : '#F1F5F9',
        secondary: isLight ? BRAND.slate : '#94A3B8',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.03em' },
      h2: { fontWeight: 700, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.015em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
      subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: '0.01em' },
      overline: { fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6875rem' },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isLight ? '#CBD5E1 transparent' : '#334155 transparent',
          },
          // Edge/IE render their own reveal and clear buttons inside password
          // inputs, which duplicates the app's visibility toggle.
          'input::-ms-reveal, input::-ms-clear': {
            display: 'none',
            width: 0,
            height: 0,
          },
          'input::-webkit-credentials-auto-fill-button, input::-webkit-strong-password-auto-fill-button': {
            visibility: 'hidden',
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 0,
            boxShadow: 'none',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: 64,
            paddingLeft: 16,
            paddingRight: 16,
            '@media (min-width: 600px)': {
              minHeight: 64,
              paddingLeft: 24,
              paddingRight: 24,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          contained: {
            padding: '8px 20px',
            '&:hover': {
              boxShadow: isLight ? '0 4px 12px rgba(13, 148, 136, 0.22)' : 'none',
            },
          },
          outlined: {
            borderColor: isLight ? '#E2E8F0' : '#334155',
            '&:hover': {
              borderColor: BRAND.teal,
              bgcolor: isLight ? alpha(BRAND.teal, 0.04) : alpha(BRAND.teal, 0.12),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isLight
              ? '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)'
              : '0 1px 3px rgba(0, 0, 0, 0.3)',
            border: `1px solid ${isLight ? '#E2E8F0' : '#1E293B'}`,
            borderRadius: 14,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 14,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRadius: 0,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginLeft: 8,
            marginRight: 8,
            paddingTop: 10,
            paddingBottom: 10,
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            color: 'inherit',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isLight ? BRAND.surface : '#1E293B',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isLight ? '#475569' : '#CBD5E1',
              borderBottom: `1px solid ${isLight ? '#E2E8F0' : '#334155'}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isLight ? '#F1F5F9' : '#1E293B',
            fontSize: '0.875rem',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& fieldset': { borderColor: isLight ? '#E2E8F0' : '#334155' },
            '&:hover fieldset': { borderColor: isLight ? '#CBD5E1' : '#475569' },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontWeight: 700, fontSize: '1.125rem', pb: 1 },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { pt: '8px !important' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { px: 3, py: 2, gap: 8 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.75rem', borderRadius: 8 },
        },
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: { fontSize: '0.8125rem' },
          li: { lineHeight: 1.5 },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700, fontSize: '0.625rem' },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${isLight ? '#E2E8F0' : '#334155'}`,
            boxShadow: isLight
              ? '0 10px 24px rgba(15, 23, 42, 0.12)'
              : '0 10px 24px rgba(0, 0, 0, 0.4)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { borderRadius: 8, margin: '2px 8px', fontSize: '0.875rem' },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  });
};

export { BRAND };
export default getTheme;
