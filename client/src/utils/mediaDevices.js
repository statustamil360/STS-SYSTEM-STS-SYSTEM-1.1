const STORAGE_KEY = 'sts_media_devices';

export const emptyMediaPrefs = () => ({
  cameraId: '',
  microphoneId: '',
  speakerId: '',
});

export const loadMediaDevicePrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMediaPrefs();
    const parsed = JSON.parse(raw);
    return {
      cameraId: parsed.cameraId || '',
      microphoneId: parsed.microphoneId || '',
      speakerId: parsed.speakerId || '',
    };
  } catch {
    return emptyMediaPrefs();
  }
};

export const saveMediaDevicePrefs = (prefs) => {
  const next = { ...loadMediaDevicePrefs(), ...prefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const getMediaConstraints = (prefs = loadMediaDevicePrefs()) => ({
  audio: prefs.microphoneId ? { deviceId: { ideal: prefs.microphoneId } } : true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    ...(prefs.cameraId ? { deviceId: { ideal: prefs.cameraId } } : {}),
  },
});

export const listMediaDevices = async () => {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { cameras: [], microphones: [], speakers: [] };
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter((d) => d.kind === 'videoinput'),
    microphones: devices.filter((d) => d.kind === 'audioinput'),
    speakers: devices.filter((d) => d.kind === 'audiooutput'),
  };
};

const writeWavString = (view, offset, value) => {
  for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
};

const createSpeakerTestWav = (durationSec = 0.28) => {
  const sampleRate = 44100;
  const sampleCount = Math.round(sampleRate * durationSec);
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeWavString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeWavString(view, 8, 'WAVE');
  writeWavString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeWavString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 80, (durationSec - t) * 80);
    view.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 880 * t) * fade * 0.5 * 32767, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

export const playSpeakerTest = async (speakerId = loadMediaDevicePrefs().speakerId, durationSec = 0.28) => {
  const url = URL.createObjectURL(createSpeakerTestWav(durationSec));
  const audio = new Audio(url);
  audio.volume = 0.75;
  if (speakerId && typeof audio.setSinkId === 'function') {
    try {
      await audio.setSinkId(speakerId);
    } catch {
      /* fall back to the system default speaker */
    }
  }
  try {
    await audio.play();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('Could not play a speaker test. Check the speaker and browser sound.');
  }
  await new Promise((resolve) => {
    const finish = () => {
      audio.onended = null;
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = finish;
    window.setTimeout(finish, durationSec * 1000 + 250);
  });
};

export const applySpeakerSink = async (element, speakerId = loadMediaDevicePrefs().speakerId) => {
  if (!element || !speakerId || typeof element.setSinkId !== 'function') return;
  try {
    await element.setSinkId(speakerId);
  } catch {
    /* some browsers block sink changes */
  }
};

export const applyMediaDevicesToJitsi = async (api) => {
  const prefs = loadMediaDevicePrefs();
  if (!api || (!prefs.cameraId && !prefs.microphoneId && !prefs.speakerId)) return;
  try {
    const devices = await api.getAvailableDevices?.();
    if (!devices) return;
    const cam = devices.videoInput?.find((d) => d.deviceId === prefs.cameraId);
    const mic = devices.audioInput?.find((d) => d.deviceId === prefs.microphoneId);
    const out = devices.audioOutput?.find((d) => d.deviceId === prefs.speakerId);
    if (cam) api.setVideoInputDevice(cam.label, cam.deviceId);
    if (mic) api.setAudioInputDevice(mic.label, mic.deviceId);
    if (out) api.setAudioOutputDevice(out.label, out.deviceId);
  } catch {
    /* Jitsi device APIs vary by version */
  }
};
