import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import {
  formatDate, formatDateTime, formatTime, formatClock, formatDateKey,
} from '../utils/dateTime';

const useSystemDateTime = () => {
  const timezone = useSelector((state) => state.settings.timezone) || DEFAULT_TIMEZONE;

  return useMemo(() => ({
    timezone,
    formatDate: (value, options) => formatDate(value, timezone, options),
    formatDateTime: (value, options) => formatDateTime(value, timezone, options),
    formatTime: (value, options) => formatTime(value, timezone, options),
    formatClock: (date, options) => formatClock(date, timezone, options),
    formatDateKey: (value) => formatDateKey(value, timezone),
  }), [timezone]);
};

export default useSystemDateTime;
