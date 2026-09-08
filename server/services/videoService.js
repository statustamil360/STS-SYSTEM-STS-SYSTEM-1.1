const { buildIceServers } = require('./turnService');

const sanitizeRoomName = (code) => String(code || 'room')
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 48);

const getProvider = () => {
  const value = String(process.env.VIDEO_PROVIDER || 'jitsi').trim().toLowerCase();
  return value === 'webrtc' ? 'webrtc' : 'jitsi';
};

const getJitsiBaseUrl = () => String(process.env.JITSI_BASE_URL || 'https://meet.asterixmc.com')
  .trim()
  .replace(/\/$/, '');

const getJitsiDomain = () => {
  try {
    return new URL(getJitsiBaseUrl()).hostname;
  } catch {
    return 'meet.asterixmc.com';
  }
};

const buildMeetingLink = (conferenceCode) => `${getJitsiBaseUrl()}/${sanitizeRoomName(conferenceCode)}`;

const withMeetingLink = (row) => {
  if (!row) return row;
  if (getProvider() !== 'jitsi' || !row.conference_code) return row;
  return { ...row, meeting_link: buildMeetingLink(row.conference_code) };
};

const withMeetingLinks = (rows) => (Array.isArray(rows) ? rows.map(withMeetingLink) : rows);

exports.getProvider = getProvider;
exports.sanitizeRoomName = sanitizeRoomName;
exports.getJitsiBaseUrl = getJitsiBaseUrl;
exports.getJitsiDomain = getJitsiDomain;
exports.buildMeetingLink = buildMeetingLink;
exports.withMeetingLink = withMeetingLink;
exports.withMeetingLinks = withMeetingLinks;

exports.ensureRoom = async (conferenceCode, { recordMeeting = false } = {}) => {
  const roomId = sanitizeRoomName(conferenceCode);
  if (recordMeeting || getProvider() === 'webrtc') {
    return {
      provider: 'webrtc',
      roomId,
    };
  }
  return {
    provider: 'jitsi',
    roomId,
    jitsiUrl: buildMeetingLink(conferenceCode),
    jitsiDomain: getJitsiDomain(),
  };
};

exports.getIceServers = () => buildIceServers();
