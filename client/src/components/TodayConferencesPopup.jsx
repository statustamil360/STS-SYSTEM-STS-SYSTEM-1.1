import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Stack, Chip, Button, Dialog,
  MobileStepper, FormControlLabel, Checkbox,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloseOutlined, VideoCallOutlined, ChevronLeftOutlined, ChevronRightOutlined,
  AccessTimeOutlined, PersonOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { ROLES } from '../utils/constants';
import useSystemDateTime from '../hooks/useSystemDateTime';
import useCountdown, { getMeetingRemainingMs } from '../hooks/useCountdown';
import { formatClockTime } from '../utils/dateTime';

/** Exactly 10:00 on the countdown (600 000 ms remaining). */
const TEN_MINUTES_MS = 10 * 60 * 1000;
const REMIND_POLL_MS = 1000;
const API_REFRESH_EVERY_TICKS = 60;

const dismissKey = (userId) => `today_conf_popup_hide_${userId}`;
const remind10Key = (userId) => `today_conf_popup_remind10_${userId}`;
const remind10TriggeredKey = (userId, conferenceId) => `today_conf_popup_10triggered_${userId}_${conferenceId}`;

const isRemind10Armed = (userId) => sessionStorage.getItem(remind10Key(userId)) === '1';

const ConferenceSlideCard = ({ conference, onJoin }) => {
  const countdown = useCountdown(conference.scheduled_date, conference.scheduled_time);
  const isClosed = ['completed', 'cancelled'].includes(conference.status);

  return (
    <Card
      elevation={0}
      sx={{
        minWidth: 260,
        maxWidth: 280,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <VideoCallOutlined color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }} noWrap>
            {conference.patient_name}
          </Typography>
          <Chip label={conference.status} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
        </Stack>

        <Box
          sx={{
            mb: 1,
            p: 1.25,
            borderRadius: 2,
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.18),
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        >
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mb: 0.35 }}>
            <AccessTimeOutlined sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              {isClosed ? conference.status : countdown.prefix}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.05rem',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
              color: isClosed ? 'text.disabled' : 'primary.main',
            }}
          >
            {isClosed ? '—' : countdown.displayTime}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
            {formatClockTime(conference.scheduled_time)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <PersonOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap>{conference.conference_code}</Typography>
        </Stack>

        <Button size="small" variant="contained" fullWidth sx={{ mt: 1.5, borderRadius: 2 }} onClick={() => onJoin(conference)}>
          View Conference
        </Button>
      </CardContent>
    </Card>
  );
};

const TodayConferencesPopup = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { formatDate } = useSystemDateTime();
  const [open, setOpen] = useState(false);
  const [popupMode, setPopupMode] = useState('initial');
  const [conferences, setConferences] = useState([]);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [remind10Minutes, setRemind10Minutes] = useState(false);
  const [remind10Active, setRemind10Active] = useState(false);

  const openRef = useRef(false);
  const conferencesRef = useRef([]);
  /** Previous remaining ms per conference — used to detect crossing 00:10:00. */
  const prevRemainingRef = useRef({});

  const role = user?.role;
  const isGp = role === ROLES.GP;
  const isAhp = role === ROLES.AHP;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    conferencesRef.current = conferences;
  }, [conferences]);

  const loadConferences = useCallback(async () => {
    const { data } = await api.get('/conferences/schedule?range=today');
    const rows = (data.data ?? []).filter((c) => !['completed', 'cancelled'].includes(c.status)).slice(0, 3);
    setConferences(rows);
    conferencesRef.current = rows;
    return rows;
  }, []);

  const seedRemainingBaseline = useCallback((rows) => {
    rows.forEach((c) => {
      prevRemainingRef.current[c.id] = getMeetingRemainingMs(c);
    });
  }, []);

  const openInitialPopup = useCallback((rows) => {
    if (!rows.length || !user?.id) return;
    if (sessionStorage.getItem(dismissKey(user.id))) return;
    setPopupMode('initial');
    setStep(0);
    setOpen(true);
  }, [user?.id]);

  /**
   * Reminder fires once when countdown crosses from above 00:10:00 to at/below 00:10:00.
   * Example: 00:12:30 → armed → at 00:10:00 (not 00:10:59) popup reopens.
   */
  const findTenMinuteCrossing = useCallback((rows) => {
    if (!user?.id || !isRemind10Armed(user.id)) return null;
    if (sessionStorage.getItem(dismissKey(user.id))) return null;

    for (const conference of rows) {
      if (sessionStorage.getItem(remind10TriggeredKey(user.id, conference.id))) continue;

      const remaining = getMeetingRemainingMs(conference);
      const prev = prevRemainingRef.current[conference.id];

      if (prev === undefined) {
        prevRemainingRef.current[conference.id] = remaining;
        continue;
      }

      const crossedTenMinuteMark = prev > TEN_MINUTES_MS && remaining <= TEN_MINUTES_MS && remaining > 0;
      prevRemainingRef.current[conference.id] = remaining;

      if (crossedTenMinuteMark) {
        return conference;
      }
    }

    return null;
  }, [user?.id]);

  const openTenMinuteReminder = useCallback((conference, rows) => {
    if (!user?.id) return;
    const idx = rows.findIndex((c) => c.id === conference.id);
    sessionStorage.setItem(remind10TriggeredKey(user.id, conference.id), '1');
    setPopupMode('tenMinuteReminder');
    setStep(idx >= 0 ? idx : 0);
    setDontShowAgain(false);
    setRemind10Minutes(false);
    setOpen(true);
  }, [user?.id]);

  const armTenMinuteReminder = useCallback((rows) => {
    if (!user?.id) return;
    sessionStorage.setItem(remind10Key(user.id), '1');
    rows.forEach((c) => sessionStorage.removeItem(remind10TriggeredKey(user.id, c.id)));
    seedRemainingBaseline(rows);
    setRemind10Active(true);
  }, [user?.id, seedRemainingBaseline]);

  const handleClose = () => {
    if (user?.id && dontShowAgain) {
      sessionStorage.setItem(dismissKey(user.id), '1');
      sessionStorage.removeItem(remind10Key(user.id));
      setRemind10Active(false);
      prevRemainingRef.current = {};
    } else if (popupMode === 'initial' && remind10Minutes && user?.id) {
      armTenMinuteReminder(conferencesRef.current);
    }

    setDontShowAgain(false);
    setRemind10Minutes(false);
    setOpen(false);
  };

  useEffect(() => {
    if ((!isGp && !isAhp) || !user?.id) return undefined;

    if (sessionStorage.getItem(dismissKey(user.id))) {
      setLoaded(true);
      setOpen(false);
      setRemind10Active(false);
      return undefined;
    }

    const armed = isRemind10Armed(user.id);
    setRemind10Active(armed);
    setLoaded(false);
    setStep(0);
    setDontShowAgain(false);
    setRemind10Minutes(false);
    prevRemainingRef.current = {};

    loadConferences()
      .then((rows) => {
        if (armed) {
          seedRemainingBaseline(rows);
          return;
        }
        if (rows.length > 0) {
          openInitialPopup(rows);
        }
      })
      .catch(() => {
        setConferences([]);
        setOpen(false);
      })
      .finally(() => setLoaded(true));

    return undefined;
  }, [isGp, isAhp, user?.id, loadConferences, openInitialPopup, seedRemainingBaseline]);

  useEffect(() => {
    if ((!isGp && !isAhp) || !user?.id || !remind10Active) return undefined;
    if (sessionStorage.getItem(dismissKey(user.id))) return undefined;

    let tickCount = 0;

    const tick = async () => {
      if (sessionStorage.getItem(dismissKey(user.id))) {
        setRemind10Active(false);
        return;
      }
      if (!isRemind10Armed(user.id)) {
        setRemind10Active(false);
        return;
      }
      if (openRef.current) return;

      tickCount += 1;
      let rows = conferencesRef.current;
      if (rows.length === 0 || tickCount % API_REFRESH_EVERY_TICKS === 0) {
        try {
          rows = await loadConferences();
        } catch {
          return;
        }
      }

      const due = findTenMinuteCrossing(rows);
      if (due) {
        openTenMinuteReminder(due, rows);
      }
    };

    const timer = window.setInterval(tick, REMIND_POLL_MS);
    tick();
    return () => window.clearInterval(timer);
  }, [
    remind10Active,
    isGp,
    isAhp,
    user?.id,
    loadConferences,
    findTenMinuteCrossing,
    openTenMinuteReminder,
  ]);

  if (!isGp && !isAhp) return null;
  if (!loaded || !open) return null;

  const maxSteps = conferences.length;
  const current = conferences[step];
  const isTenMinuteReminder = popupMode === 'tenMinuteReminder';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          position: 'fixed',
          top: 24,
          right: 24,
          m: 0,
          maxWidth: 320,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 16px 48px rgba(15, 23, 42, 0.18)',
        },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Today&apos;s Conferences</Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(new Date())}</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <ConferenceSlideCard
          conference={current}
          onJoin={(c) => {
            setOpen(false);
            setDontShowAgain(false);
            setRemind10Minutes(false);
            navigate('/conferences?tab=upcoming', { state: { highlightId: c.id } });
          }}
        />

        {maxSteps > 1 && (
          <MobileStepper
            variant="dots"
            steps={maxSteps}
            position="static"
            activeStep={step}
            sx={{ mt: 1.5, bgcolor: 'transparent', px: 0 }}
            nextButton={
              <IconButton size="small" disabled={step >= maxSteps - 1} onClick={() => setStep((s) => s + 1)}>
                <ChevronRightOutlined />
              </IconButton>
            }
            backButton={
              <IconButton size="small" disabled={step <= 0} onClick={() => setStep((s) => s - 1)}>
                <ChevronLeftOutlined />
              </IconButton>
            }
          />
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>
          {step + 1} of {maxSteps} upcoming today
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 1.5, alignItems: 'center', justifyContent: isTenMinuteReminder ? 'flex-start' : 'space-between' }}
        >
          <FormControlLabel
            sx={{ mx: 0, flex: isTenMinuteReminder ? undefined : 1, '& .MuiFormControlLabel-label': { lineHeight: 1.2 } }}
            control={
              <Checkbox
                size="small"
                checked={dontShowAgain}
                onChange={(e) => {
                  setDontShowAgain(e.target.checked);
                  if (e.target.checked) setRemind10Minutes(false);
                }}
                sx={{ p: 0.5 }}
              />
            }
            label={(
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                Don&apos;t show again
              </Typography>
            )}
          />
          {!isTenMinuteReminder && (
            <FormControlLabel
              sx={{ mx: 0, flex: 1, '& .MuiFormControlLabel-label': { lineHeight: 1.2 } }}
              control={
                <Checkbox
                  size="small"
                  checked={remind10Minutes}
                  disabled={dontShowAgain}
                  onChange={(e) => setRemind10Minutes(e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              }
              label={(
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Remaining 10 minutes
                </Typography>
              )}
            />
          )}
        </Stack>
      </Box>
    </Dialog>
  );
};

export default TodayConferencesPopup;
