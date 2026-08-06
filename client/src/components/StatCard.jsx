import { Box, Card, Typography, Chip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const ACCENT_PRESETS = {
  'primary.main': { from: '#1E3A5F', to: '#2E5984', text: '#1E3A5F' },
  'secondary.main': { from: '#0D9488', to: '#14B8A6', text: '#0F766E' },
  'info.main': { from: '#0284C7', to: '#38BDF8', text: '#0369A1' },
  'warning.main': { from: '#D97706', to: '#FBBF24', text: '#B45309' },
  'success.main': { from: '#059669', to: '#34D399', text: '#047857' },
  'error.main': { from: '#DC2626', to: '#F87171', text: '#B91C1C' },
  indigo: { from: '#4F46E5', to: '#818CF8', text: '#4338CA' },
  violet: { from: '#7C3AED', to: '#A78BFA', text: '#6D28D9' },
};

const resolvePaletteColor = (theme, color) =>
  String(color).split('.').reduce((acc, key) => acc?.[key], theme.palette) ?? color;

const getAccent = (theme, color = 'primary.main') => {
  if (ACCENT_PRESETS[color]) return ACCENT_PRESETS[color];
  const hex = resolvePaletteColor(theme, color);
  return { from: hex, to: hex, text: hex };
};

const StatCard = ({ title, value, icon: Icon, color = 'primary.main', subtitle, chip, onClick }) => {
  const theme = useTheme();
  const accent = getAccent(theme, color);
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: isDark ? 'divider' : alpha(accent.from, 0.12),
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: isDark
          ? 'none'
          : `0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px ${alpha(accent.from, 0.06)}`,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 120,
          height: 120,
          top: -40,
          right: -40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent.from, 0.14)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(accent.from, 0.28),
          boxShadow: `0 8px 28px ${alpha(accent.from, 0.16)}, 0 2px 8px rgba(15, 23, 42, 0.06)`,
        },
      }}
    >
      <Box
        sx={{
          p: 2.5,
          pt: 2.75,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 128,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Typography
            component="span"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.6875rem',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              lineHeight: 1.45,
              maxWidth: 'calc(100% - 52px)',
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
              boxShadow: `0 6px 16px ${alpha(accent.from, 0.35)}`,
              color: '#FFFFFF',
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        </Box>

        <Typography
          sx={{
            mt: 'auto',
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            color: accent.text,
          }}
        >
          {value ?? 0}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              mt: 1,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}

        {chip && (
          <Box sx={{ mt: 1.5 }}>
            <Chip
              label={chip}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: alpha(accent.from, 0.08),
                color: accent.text,
                border: `1px solid ${alpha(accent.from, 0.2)}`,
              }}
            />
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default StatCard;
