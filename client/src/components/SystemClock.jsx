import { useEffect, useState } from 'react';
import { Box, Typography, Tooltip, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AccessTimeOutlined } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { formatClock } from '../utils/dateTime';
import { DEFAULT_TIMEZONE, getTimezoneLabel } from '../utils/timezones';

const SystemClock = () => {
  const timezone = useSelector((state) => state.settings.timezone) || DEFAULT_TIMEZONE;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { time, zone, offset, dateLabel } = formatClock(now, timezone);
  const [timeMain, timePeriod] = (() => {
    const match = time.match(/^(.+)\s+(AM|PM)$/i);
    if (!match) return [time, ''];
    return [match[1], match[2]];
  })();

  return (
    <Tooltip
      title={`${getTimezoneLabel(timezone)} · ${dateLabel}`}
      arrow
      slotProps={{
        tooltip: {
          sx: {
            fontSize: '0.75rem',
            fontWeight: 500,
            px: 1.5,
            py: 0.75,
            borderRadius: 1.5,
          },
        },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1.25,
          px: 1.5,
          py: 0.625,
          borderRadius: 2.5,
          position: 'relative',
          minWidth: 0,
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(theme.palette.primary.dark, 0.03)} 55%, ${theme.palette.background.paper} 100%)`,
          boxShadow: (theme) => `0 2px 14px ${alpha(theme.palette.primary.dark, 0.08)}, inset 0 1px 0 ${alpha('#FFFFFF', 0.65)}`,
          transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
          '&:hover': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
            boxShadow: (theme) => `0 4px 18px ${alpha(theme.palette.primary.dark, 0.12)}, inset 0 1px 0 ${alpha('#FFFFFF', 0.75)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            background: (theme) => `linear-gradient(180deg, ${alpha('#FFFFFF', 0.35)} 0%, transparent 42%)`,
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
            boxShadow: (theme) => `inset 0 1px 0 ${alpha('#FFFFFF', 0.45)}`,
          }}
        >
          <AccessTimeOutlined sx={{ fontSize: 17, color: 'primary.main' }} />
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'success.main',
              border: '1.5px solid',
              borderColor: 'background.paper',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.18)',
              animation: 'clockPulse 2.4s ease-in-out infinite',
              '@keyframes clockPulse': {
                '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.72, transform: 'scale(0.88)' },
              },
            }}
          />
        </Box>

        <Stack spacing={0.15} sx={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline' }}>
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: '0.8125rem',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                color: 'primary.dark',
                lineHeight: 1.1,
              }}
            >
              {timeMain}
            </Typography>
            {timePeriod && (
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                  letterSpacing: '0.06em',
                  color: 'primary.main',
                  lineHeight: 1.1,
                  textTransform: 'uppercase',
                }}
              >
                {timePeriod}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                px: 0.75,
                py: 0.125,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.12),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.625rem',
                  letterSpacing: '0.04em',
                  color: 'primary.main',
                  lineHeight: 1.2,
                }}
              >
                {offset || zone}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                fontSize: '0.625rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                maxWidth: 72,
              }}
            >
              {zone !== offset ? zone : 'System'}
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Tooltip>
  );
};

export default SystemClock;
