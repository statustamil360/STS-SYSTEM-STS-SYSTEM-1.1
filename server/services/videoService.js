const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_DOMAIN = process.env.DAILY_DOMAIN;

const dailyHeaders = () => ({
  Authorization: `Bearer ${DAILY_API_KEY}`,
  'Content-Type': 'application/json',
});

const sanitizeRoomName = (code) => String(code || 'room')
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 48);

exports.getProvider = () => (DAILY_API_KEY ? 'daily' : 'jitsi');

exports.ensureRoom = async (conferenceCode) => {
  const roomName = sanitizeRoomName(conferenceCode);

  if (!DAILY_API_KEY) {
    return {
      provider: 'jitsi',
      roomId: roomName,
      roomUrl: `https://meet.jit.si/amc-${roomName}`,
    };
  }

  const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: dailyHeaders(),
  });

  if (getRes.ok) {
    const room = await getRes.json();
    return {
      provider: 'daily',
      roomId: room.name,
      roomUrl: room.url,
    };
  }

  const createRes = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: dailyHeaders(),
    body: JSON.stringify({
      name: roomName,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Daily room: ${err}`);
  }

  const room = await createRes.json();
  return {
    provider: 'daily',
    roomId: room.name,
    roomUrl: room.url,
  };
};

exports.createMeetingToken = async ({ roomName, userName, isOwner = false }) => {
  if (!DAILY_API_KEY) {
    return null;
  }

  const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: dailyHeaders(),
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create meeting token: ${err}`);
  }

  const data = await res.json();
  return data.token;
};
