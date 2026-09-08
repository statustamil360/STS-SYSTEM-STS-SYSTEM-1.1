import { useCallback, useEffect, useState } from 'react';
import {
  Fab, Dialog, DialogTitle, DialogContent, IconButton, Box, keyframes, Zoom,
} from '@mui/material';
import { CalendarMonthOutlined, CloseOutlined } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import SimpleCalendar from './SimpleCalendar';
import api from '../services/api';
import { ROLES } from '../utils/constants';
import useSystemDateTime from '../hooks/useSystemDateTime';
import useLiveRefresh from '../hooks/useLiveRefresh';

const popPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(13, 148, 136, 0.35); }
  50% { transform: scale(1.08); box-shadow: 0 12px 32px rgba(13, 148, 136, 0.5); }
`;

const CALENDAR_ROLES = [ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.GP, ROLES.AHP];

const FloatingCalendarButton = () => {
  const { user } = useSelector((state) => state.auth);
  const { receptionist_calendar_widget } = useSelector((state) => state.settings);
  const { calendarPopupEnabled } = useSelector((state) => state.ui);
  const { formatDateKey } = useSystemDateTime();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [todayConferences, setTodayConferences] = useState([]);

  const role = user?.role;
  const isFrontDesk = role === ROLES.RECEPTIONIST || role === ROLES.ADMIN;
  const isClinical = role === ROLES.GP || role === ROLES.AHP;

  const loadEvents = useCallback(async () => {
    try {
      const requests = [
        api.get('/conferences/schedule?range=month'),
        api.get('/conferences/schedule?range=today'),
        ...(isFrontDesk ? [api.get('/dashboard/appointments/today')] : []),
      ];
      const [confRes, todayConfRes, apptRes] = await Promise.all(requests);
      const confs = confRes.data.data ?? [];
      const todayConfs = (todayConfRes.data.data ?? [])
        .filter((c) => !['completed', 'cancelled'].includes(c.status));
      const appts = isFrontDesk ? (apptRes?.data?.data ?? []) : [];
      setTodayConferences(todayConfs);
      setEvents([
        ...appts.map((a) => ({
          title: `Appt: ${a.patient_name}`,
          date: formatDateKey(a.appointment_date),
          color: '#1E3A5F',
        })),
        ...confs.map((c) => ({
          title: `Conf: ${c.patient_name}`,
          date: formatDateKey(c.scheduled_date),
          color: '#0D9488',
        })),
      ]);
    } catch {
      setEvents([]);
      setTodayConferences([]);
    }
  }, [formatDateKey, isFrontDesk]);

  useEffect(() => {
    if (open) loadEvents();
  }, [open, loadEvents]);

  useLiveRefresh('schedule:refresh', () => {
    if (open) loadEvents();
  });

  if (!CALENDAR_ROLES.includes(role)) return null;
  if (!calendarPopupEnabled) return null;
  if (role === ROLES.RECEPTIONIST && receptionist_calendar_widget === false) return null;

  return (
    <>
      <Zoom in>
        <Fab
          color="primary"
          aria-label="Open calendar"
          onClick={() => setOpen(true)}
          size="small"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 44,
            height: 44,
            minHeight: 44,
            zIndex: (theme) => theme.zIndex.speedDial,
            animation: `${popPulse} 2.4s ease-in-out infinite`,
          }}
        >
          <CalendarMonthOutlined sx={{ fontSize: 20 }} />
        </Fab>
      </Zoom>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          {isClinical ? 'Assigned Conferences' : 'Schedule Calendar'}
          <IconButton size="small" onClick={() => setOpen(false)}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ py: 1 }}>
            <SimpleCalendar events={events} todayConferences={todayConferences} />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingCalendarButton;
