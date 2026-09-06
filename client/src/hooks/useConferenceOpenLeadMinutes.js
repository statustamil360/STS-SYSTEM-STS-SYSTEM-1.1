import { useSelector } from 'react-redux';

export const DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES = 15;

/**
 * How many minutes before the scheduled time a receptionist may open a meeting.
 * Configured by the admin in Preferences and enforced again on the server.
 */
const useConferenceOpenLeadMinutes = () => {
  const configured = useSelector((state) => state.settings.conference_open_lead_minutes);
  const parsed = Number(configured);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_CONFERENCE_OPEN_LEAD_MINUTES;
};

export default useConferenceOpenLeadMinutes;
