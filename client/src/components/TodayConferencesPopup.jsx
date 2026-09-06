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
import useConferenceOpenLeadMinutes from '../hooks/useConferenceOpenLeadMinutes';
import useReceptionistPermissions from '../hooks/useReceptionistPermissions';
import { formatClockTime } from '../utils/dateTime';

/** Exactly 2:00 on the countdown (120 000 ms remaining). */
const REMIND_LATER_MS = 2 * 60 * 1000;
const REMIND_POLL_MS = 1000;
const API_REFRESH_EVERY_TICKS = 15;

/** Statuses where reception/admin still has to open the meeting. */
const NOT_YET_OPENED = ['scheduled', 'confirmed'];

const dismissKey = (userId) => `today_conf_popup_hide_${userId}`;
const remindLaterKey = (userId) => `today_conf_popup_remind_${userId}`;
const firedKey = (scope, userId, conferenceId) => `today_conf_popup_${scope}_${userId}_${conferenceId}`;

const isRemindLaterArmed = (userId) => sessionStorage.getItem(remindLaterKey(userId)) === '1';

const ConferenceSlideCard = ({ conference, onJoin, onJoinLabel = 'View Conference' }) => {
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
          {onJoinLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

const TodayConferencesPopup = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const conferencePopupEnabled = useSelector((state) => state.ui.conferencePopupEnabled);
  const { formatDate } = useSystemDateTime();
  const openLeadMinutes = useConferenceOpenLeadMinutes();
  const { can } = useReceptionistPermissions();
  const [open, setOpen] = useState(false);
  const [popupMode, setPopupMode] = useState('initial');
  const [conferences, setConferences] = useState([]);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [remindLater, setRemindLater] = useState(false);
  const [remindLaterActive, setRemindLaterActive] = useState(false);

  const openRef = useRef(false);
  /** Previous remaining ms per conference, one map per threshold being watched. */
  const remindPrevRef = useRef({});
  const openWindowPrevRef = useRef({});
  const conferencesRef = useRef([]);

  const role = user?.role;
  const isGp = role === ROLES.GP;
  const isAhp = role === ROLES.AHP;
  /** Reception opens meetings; admins get the same alert as their supervisor. */
  const isMeetingHost = role === ROLES.ADMIN
    || (role === ROLES.RECEPTIONIST && can('conferences_page'));
  const isClinical = isGp || isAhp;
  const isWatcher = isClinical || isMeetingHost;
  const openWindowMs = openLeadMinutes * 60 * 1000;
  const canOpenMeetings = can('conference_open');

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    conferencesRef.current = conferences;
  }, [conferences]);

  const loadConferences = useCallback(async () => {
    const { data } = await api.get('/conferences/schedule?range=today');
    const rows = (data.data ?? []).filter((c) => !['completed', 'cancelled'].includes(c.status));
    setConferences(rows);
    conferencesRef.current = rows;
    return rows;
  }, []);

  const seedRemainingBaseline = useCallback((rows) => {
    rows.forEach((c) => {
      remindPrevRef.current[c.id] = getMeetingRemainingMs(c);
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
   * Reminder fires once when the countdown crosses from above the threshold to at/below it.
   * Example with a 2 minute threshold: 00:02:30 → armed → at 00:02:00 (not 00:02:59) popup reopens.
   */
  const findCrossing = useCallback((rows, thresholdMs, scope, prevRef, keepAfterStart = false) => {
    if (!user?.id) return null;
    if (sessionStorage.getItem(dismissKey(user.id))) return null;

    for (const conference of rows) {
      if (sessionStorage.getItem(firedKey(scope, user.id, conference.id))) continue;

      const remaining = getMeetingRemainingMs(conference);
      const prev = prevRef.current[conference.id];
      prevRef.current[conference.id] = remaining;

      const inWindow = remaining <= thresholdMs && (keepAfterStart || remaining > 0);
      // A conference already inside the window when first seen still deserves the popup.
      const crossed = prev === undefined ? inWindow : prev > thresholdMs && inWindow;

      if (crossed) return conference;
    }

    return null;
  }, [user?.id]);

  /** Reception/admin need to know the moment the "Open meeting" button unlocks. */
  const findOpenWindowDue = useCallback((rows) => findCrossing(
    rows.filter((c) => NOT_YET_OPENED.includes(c.status)),
    openWindowMs,
    'openwindow',
    openWindowPrevRef,
    true,
  ), [findCrossing, openWindowMs]);

  const findRemindLaterDue = useCallback((rows) => {
    if (!user?.id || !isRemindLaterArmed(user.id)) return null;
    return findCrossing(rows, REMIND_LATER_MS, 'remind', remindPrevRef);
  }, [findCrossing, user?.id]);

  const reopenPopup = useCallback((mode, scope, conference, rows) => {
    if (!user?.id) return;
    const idx = rows.findIndex((c) => c.id === conference.id);
    sessionStorage.setItem(firedKey(scope, user.id, conference.id), '1');
    setPopupMode(mode);
    setStep(idx >= 0 ? idx : 0);
    setDontShowAgain(false);
    setRemindLater(false);
    setOpen(true);
  }, [user?.id]);

  const armRemindLater = useCallback((rows) => {
    if (!user?.id) return;
    sessionStorage.setItem(remindLaterKey(user.id), '1');
    rows.forEach((c) => sessionStorage.removeItem(firedKey('remind', user.id, c.id)));
    seedRemainingBaseline(rows);
    setRemindLaterActive(true);
  }, [user?.id, seedRemainingBaseline]);

  const handleClose = () => {
    if (user?.id && dontShowAgain) {
      sessionStorage.setItem(dismissKey(user.id), '1');
      sessionStorage.removeItem(remindLaterKey(user.id));
      setRemindLaterActive(false);
      remindPrevRef.current = {};
      openWindowPrevRef.current = {};
    } else if (remindLater && user?.id) {
      armRemindLater(conferencesRef.current);
    }

    setDontShowAgain(false);
    setRemindLater(false);
    setOpen(false);
  };

  useEffect(() => {
    if (!conferencePopupEnabled || !isWatcher || !user?.id) {
      setOpen(false);
      return undefined;
    }

    if (sessionStorage.getItem(dismissKey(user.id))) {
      setLoaded(true);
      setOpen(false);
      setRemindLaterActive(false);
      return undefined;
    }

    const armed = isRemindLaterArmed(user.id);
    setRemindLaterActive(armed);
    setLoaded(false);
    setStep(0);
    setDontShowAgain(false);
    setRemindLater(false);
    remindPrevRef.current = {};
    openWindowPrevRef.current = {};

    loadConferences()
      .then((rows) => {
        if (armed) {
          seedRemainingBaseline(rows);
          return;
        }
        // GP/AHP see today's list on login. Reception/admin wait until the
        // "Open meeting" window opens, unless a meeting is already inside it.
        if (isMeetingHost) {
          const due = findOpenWindowDue(rows);
          if (due) reopenPopup('openWindow', 'openwindow', due, rows);
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
  }, [
    conferencePopupEnabled,
    isWatcher,
    isMeetingHost,
    user?.id,
    loadConferences,
    openInitialPopup,
    seedRemainingBaseline,
    findOpenWindowDue,
    reopenPopup,
  ]);

  useEffect(() => {
    if (!conferencePopupEnabled || !isWatcher || !user?.id) return undefined;
    if (!remindLaterActive && !isMeetingHost) return undefined;
    if (sessionStorage.getItem(dismissKey(user.id))) return undefined;

    let tickCount = 0;

    const tick = async () => {
      if (sessionStorage.getItem(dismissKey(user.id))) {
        setRemindLaterActive(false);
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

      if (isMeetingHost) {
        const dueOpen = findOpenWindowDue(rows);
        if (dueOpen) {
          reopenPopup('openWindow', 'openwindow', dueOpen, rows);
          return;
        }
      }

      if (!remindLaterActive) return;
      if (!isRemindLaterArmed(user.id)) {
        setRemindLaterActive(false);
        return;
      }

      const dueRemind = findRemindLaterDue(rows);
      if (dueRemind) {
        reopenPopup('remindLater', 'remind', dueRemind, rows);
      }
    };

    const timer = window.setInterval(tick, REMIND_POLL_MS);
    tick();
    return () => window.clearInterval(timer);
  }, [
    conferencePopupEnabled,
    remindLaterActive,
    isWatcher,
    isMeetingHost,
    user?.id,
    loadConferences,
    findOpenWindowDue,
    findRemindLaterDue,
    reopenPopup,
  ]);

  if (!conferencePopupEnabled || !isWatcher) return null;
  if (!loaded || !open) return null;

  const maxSteps = conferences.length;
  const current = conferences[step] || conferences[0];
  if (!current) return null;
  const isRemindPopup = popupMode === 'remindLater';
  const isOpenWindow = popupMode === 'openWindow';

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
          <Typography variant="caption" color="text.secondary">
            {isOpenWindow ? 'This meeting can be opened now' : formatDate(new Date())}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}><CloseOutlined fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        <ConferenceSlideCard
          conference={current}
          onJoinLabel={isMeetingHost && canOpenMeetings ? 'Open meeting' : 'View Conference'}
          onJoin={(c) => {
            setOpen(false);
            setDontShowAgain(false);
            setRemindLater(false);
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
          sx={{ mt: 1.5, alignItems: 'center', justifyContent: isRemindPopup ? 'flex-start' : 'space-between' }}
        >
          <FormControlLabel
            sx={{ mx: 0, flex: isRemindPopup ? undefined : 1, '& .MuiFormControlLabel-label': { lineHeight: 1.2 } }}
            control={
              <Checkbox
                size="small"
                checked={dontShowAgain}
                onChange={(e) => {
                  setDontShowAgain(e.target.checked);
                  if (e.target.checked) setRemindLater(false);
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
          {!isRemindPopup && (
            <FormControlLabel
              sx={{ mx: 0, flex: 1, '& .MuiFormControlLabel-label': { lineHeight: 1.2 } }}
              control={
                <Checkbox
                  size="small"
                  checked={remindLater}
                  disabled={dontShowAgain}
                  onChange={(e) => setRemindLater(e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              }
              label={(
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Remaining 2 minutes
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
