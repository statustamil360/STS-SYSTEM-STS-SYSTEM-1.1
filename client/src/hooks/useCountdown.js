import { useEffect, useMemo, useState } from 'react';

const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

export const formatDuration = (ms) => {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const getMeetingDateTime = (date, time) => {
  if (!date || !time) return null;
  let dateStr = date;
  if (date instanceof Date) {
    dateStr = date.toISOString().slice(0, 10);
  } else if (typeof date === 'string' && date.includes('T')) {
    dateStr = date.slice(0, 10);
  } else {
    dateStr = String(date).slice(0, 10);
  }
  const timePart = String(time).slice(0, 5);
  const parsed = new Date(`${dateStr}T${timePart}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getMeetingRemainingMs = (meeting, now = Date.now()) => {
  const target = getMeetingDateTime(meeting.scheduled_date, meeting.scheduled_time);
  if (!target) return Number.POSITIVE_INFINITY;
  return Math.max(0, target.getTime() - now);
};

/** Shortest countdown first; live meetings on top. */
export const sortMeetingsByCountdown = (meetings, now = Date.now()) => {
  const rank = (meeting) => {
    if (meeting.status === 'live') return { tier: 0, key: 0 };
    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return { tier: 4, key: Number.POSITIVE_INFINITY };
    }

    const target = getMeetingDateTime(meeting.scheduled_date, meeting.scheduled_time);
    if (!target) return { tier: 3, key: Number.POSITIVE_INFINITY };

    const diff = target.getTime() - now;
    if (diff <= 0) {
      return { tier: 1, key: Math.abs(diff) };
    }
    return { tier: 2, key: diff };
  };

  return [...meetings].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.tier !== rb.tier) return ra.tier - rb.tier;
    if (ra.key !== rb.key) return ra.key - rb.key;
    const ta = getMeetingDateTime(a.scheduled_date, a.scheduled_time)?.getTime() ?? 0;
    const tb = getMeetingDateTime(b.scheduled_date, b.scheduled_time)?.getTime() ?? 0;
    return ta - tb;
  });
};

export const useCountdown = (date, time) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const target = getMeetingDateTime(date, time);
    if (!target || Number.isNaN(target.getTime())) {
      return {
        displayTime: '--:--:--',
        ended: false,
        started: false,
        diffMs: 0,
        prefix: 'Starts in',
      };
    }

    const diffMs = target.getTime() - now;
    const ended = diffMs <= 0;
    const displayTime = formatDuration(diffMs);

    return {
      displayTime,
      ended,
      started: ended,
      diffMs,
      prefix: ended ? 'Since start' : 'Starts in',
    };
  }, [date, time, now]);
};

export default useCountdown;
