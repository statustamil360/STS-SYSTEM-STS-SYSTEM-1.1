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

const popPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(13, 148, 136, 0.35); }
  50% { transform: scale(1.08); box-shadow: 0 12px 32px rgba(13, 148, 136, 0.5); }
`;

const FloatingCalendarButton = () => {
  const { user } = useSelector((state) => state.auth);
  const { receptionist_calendar_widget } = useSelector((state) => state.settings);
  const { formatDateKey } = useSystemDateTime();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [todayConferences, setTodayConferences] = useState([]);

  const loadEvents = useCallback(async () => {
    try {
      const [apptRes, confRes, todayConfRes] = await Promise.all([
        api.get('/dashboard/appointments/today'),
        api.get('/conferences/schedule?range=month'),
        api.get('/conferences/schedule?range=today'),
      ]);
      const appts = apptRes.data.data ?? [];
      const confs = confRes.data.data ?? [];
      const todayConfs = (todayConfRes.data.data ?? [])
        .filter((c) => !['completed', 'cancelled'].includes(c.status));
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
  }, [formatDateKey]);

  useEffect(() => {
    if (open) loadEvents();
  }, [open, loadEvents]);

  if (user?.role !== ROLES.RECEPTIONIST || receptionist_calendar_widget === false) return null;

  return (
    <>
      <Zoom in>
        <Fab
          color="primary"
          aria-label="Open calendar"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: (theme) => theme.zIndex.speedDial,
            animation: `${popPulse} 2.4s ease-in-out infinite`,
          }}
        >
          <CalendarMonthOutlined />
        </Fab>
      </Zoom>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          Schedule Calendar
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
