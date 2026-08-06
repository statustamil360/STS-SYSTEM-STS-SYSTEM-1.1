import { Box, Typography, Chip, Stack, alpha } from '@mui/material';
import {
  EventOutlined, VideoCallOutlined, ChevronLeftOutlined, ChevronRightOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SimpleCalendar = ({ events = [] }) => {
  const today = dayjs();
  const startOfMonth = today.startOf('month');
  const daysInMonth = today.daysInMonth();
  const startDay = startOfMonth.day();

  const eventsByDate = events.reduce((acc, event) => {
    const key = event.date?.slice(0, 10);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  const upcoming = [...events]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, 5);

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'center', mb: 2 }}
      >
        <ChevronLeftOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', minWidth: 140, textAlign: 'center' }}>
          {today.format('MMMM YYYY')}
        </Typography>
        <ChevronRightOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
        {WEEK_DAYS.map((day) => (
          <Typography
            key={day}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.625rem',
              letterSpacing: '0.08em',
              color: 'text.secondary',
              py: 0.5,
            }}
          >
            {day.toUpperCase()}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {cells.map((day, index) => {
          if (!day) return <Box key={`empty-${index}`} sx={{ aspectRatio: '1' }} />;
          const dateKey = today.date(day).format('YYYY-MM-DD');
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = day === today.date();
          const hasEvents = dayEvents.length > 0;

          return (
            <Box
              key={dateKey}
              sx={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.375,
                borderRadius: 2,
                position: 'relative',
                cursor: hasEvents ? 'pointer' : 'default',
                transition: 'background-color 120ms ease, transform 120ms ease',
                bgcolor: isToday
                  ? (theme) => alpha(theme.palette.primary.main, 0.1)
                  : 'transparent',
                '&:hover': hasEvents ? {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  transform: 'scale(1.05)',
                } : {},
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: isToday ? 700 : 500,
                  fontSize: '0.8125rem',
                  fontVariantNumeric: 'tabular-nums',
                  color: isToday ? 'primary.main' : 'text.primary',
                  border: isToday ? '2px solid' : 'none',
                  borderColor: isToday ? 'primary.main' : 'transparent',
                  bgcolor: isToday ? 'background.paper' : 'transparent',
                  boxShadow: isToday ? '0 2px 8px rgba(30, 58, 95, 0.12)' : 'none',
                }}
              >
                {day}
              </Box>

              {hasEvents && (
                <Stack direction="row" spacing={0.25} sx={{ position: 'absolute', bottom: 4 }}>
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <Box
                      key={`${dateKey}-${i}`}
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        bgcolor: event.color || 'primary.main',
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>

      <Stack
        direction="row"
        spacing={2.5}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {[
          { label: 'Appointments', color: '#1E3A5F' },
          { label: 'Conferences', color: '#0D9488' },
        ].map((item) => (
          <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, boxShadow: `0 0 0 2px ${alpha(item.color, 0.2)}` }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mt: 2.5, mb: 1.5, letterSpacing: '-0.01em' }}
      >
        Upcoming events
      </Typography>

      {upcoming.length === 0 ? (
        <Box
          sx={{
            py: 2.5,
            px: 2,
            borderRadius: 2,
            textAlign: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            No scheduled events this month
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {upcoming.map((event, index) => {
            const isConference = event.title?.startsWith('Conf');
            const Icon = isConference ? VideoCallOutlined : EventOutlined;
            const accent = isConference ? 'secondary' : 'primary';
            return (
              <Stack
                key={`${event.date}-${index}`}
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                  p: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme) => alpha(theme.palette[accent].main, 0.02),
                  transition: 'background-color 120ms ease, box-shadow 120ms ease',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette[accent].main, 0.05),
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: `${accent}.main`,
                    bgcolor: (theme) => alpha(theme.palette[accent].main, 0.1),
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {event.title?.replace(/^(Conf|Appt):\s*/, '')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {dayjs(event.date).format('ddd, D MMM YYYY')}
                  </Typography>
                </Box>
                <Chip
                  label={isConference ? 'Conference' : 'Appointment'}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600 }}
                />
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default SimpleCalendar;
