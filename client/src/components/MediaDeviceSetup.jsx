import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  HeadphonesOutlined, MicOutlined, VideocamOffOutlined, VideocamOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  applySpeakerSink,
  listMediaDevices,
  loadMediaDevicePrefs,
  playSpeakerTest,
  saveMediaDevicePrefs,
} from '../utils/mediaDevices';

const SEGMENTS = 22;

const deviceLabel = (device, fallback) => device.label || `${fallback} ${device.deviceId.slice(0, 6)}`;

const cardSx = {
  height: '100%',
  p: { xs: 2, sm: 2.5 },
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
  display: 'flex',
  flexDirection: 'column',
};

const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.paper',
    fontSize: '0.875rem',
    minHeight: 46,
    '& fieldset': { borderColor: alpha('#64748B', 0.22) },
    '&:hover fieldset': { borderColor: alpha('#64748B', 0.4) },
    '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 1.5 },
  },
};

const actionBtnSx = {
  alignSelf: 'flex-start',
  mt: 'auto',
  px: 1.75,
  py: 0.75,
  borderRadius: 2,
  fontWeight: 600,
  textTransform: 'none',
  color: 'text.primary',
  borderColor: alpha('#64748B', 0.28),
  bgcolor: 'background.paper',
  '&:hover': {
    borderColor: 'primary.main',
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
  },
};

const CardIcon = ({ icon: Icon }) => (
  <Box
    sx={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
      color: 'primary.main',
    }}
  >
    <Icon sx={{ fontSize: 20 }} />
  </Box>
);

const DeviceSelect = ({ label, value, options, fallback, onChange }) => (
  <TextField
    select
    fullWidth
    size="small"
    hiddenLabel
    value={options.some((d) => d.deviceId === value) ? value : ''}
    onChange={(e) => onChange(e.target.value)}
    sx={selectSx}
  >
    <MenuItem value="">{label}</MenuItem>
    {options.map((device) => (
      <MenuItem key={device.deviceId} value={device.deviceId}>
        {deviceLabel(device, fallback)}
      </MenuItem>
    ))}
  </TextField>
);

const MediaDeviceSetup = () => {
  const videoRef = useRef(null);
  const audioStreamRef = useRef(null);
  const videoStreamRef = useRef(null);
  const meterRafRef = useRef(0);
  const audioCtxRef = useRef(null);

  const [prefs, setPrefs] = useState(loadMediaDevicePrefs);
  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [error, setError] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [previewOn, setPreviewOn] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [testingCamera, setTestingCamera] = useState(false);

  const stopMic = useCallback(() => {
    window.cancelAnimationFrame(meterRafRef.current);
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setListening(false);
    setMicLevel(0);
  }, []);

  const stopCamera = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPreviewOn(false);
  }, []);

  const refreshDeviceLists = useCallback(async () => {
    const lists = await listMediaDevices();
    setCameras(lists.cameras);
    setMicrophones(lists.microphones);
    setSpeakers(lists.speakers);
    return lists;
  }, []);

  useEffect(() => {
    refreshDeviceLists().catch(() => {});
    const onChange = () => { refreshDeviceLists(); };
    navigator.mediaDevices?.addEventListener?.('devicechange', onChange);
    return () => {
      stopMic();
      stopCamera();
      navigator.mediaDevices?.removeEventListener?.('devicechange', onChange);
    };
  }, [refreshDeviceLists, stopCamera, stopMic]);

  const startMic = async (nextPrefs = prefs) => {
    setTestingMic(true);
    setError('');
    stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: nextPrefs.microphoneId ? { deviceId: { ideal: nextPrefs.microphoneId } } : true,
        video: false,
      });
      audioStreamRef.current = stream;
      await refreshDeviceLists();

      if (typeof AudioContext !== 'undefined') {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const value = (data[i] - 128) / 128;
            sum += value * value;
          }
          setMicLevel(Math.min(100, Math.round(Math.sqrt(sum / data.length) * 220)));
          meterRafRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      }
      setListening(true);
    } catch (err) {
      setError(err.message || 'Could not access the microphone. Allow permission and try again.');
    } finally {
      setTestingMic(false);
    }
  };

  const startCamera = async (nextPrefs = prefs) => {
    setTestingCamera(true);
    setError('');
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(nextPrefs.cameraId ? { deviceId: { ideal: nextPrefs.cameraId } } : {}),
        },
      });
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPreviewOn(true);
      await refreshDeviceLists();
    } catch (err) {
      setError(err.message || 'Could not access the camera. Allow permission and try again.');
    } finally {
      setTestingCamera(false);
    }
  };

  const handleDeviceChange = (key, value) => {
    const next = saveMediaDevicePrefs({ [key]: value });
    setPrefs(next);
    if (key === 'microphoneId' && listening) startMic(next);
    if (key === 'cameraId' && previewOn) startCamera(next);
    if (key === 'speakerId') applySpeakerSink(videoRef.current, value);
  };

  const testSpeaker = async () => {
    setTestingSpeaker(true);
    try {
      await playSpeakerTest(prefs.speakerId);
    } catch (err) {
      toast.error(err.message || 'Could not play a speaker test on this browser');
    } finally {
      setTestingSpeaker(false);
    }
  };

  const activeSegments = Math.round((micLevel / 100) * SEGMENTS);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={cardSx}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.25 }}>
              <CardIcon icon={MicOutlined} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>Microphone</Typography>
                <Typography variant="body2" color="text.secondary">Used for voice in conferences.</Typography>
              </Box>
            </Stack>

            <DeviceSelect
              label="System default"
              value={prefs.microphoneId}
              options={microphones}
              fallback="Microphone"
              onChange={(value) => handleDeviceChange('microphoneId', value)}
            />

            <Box sx={{ mt: 2.25, mb: 2.5 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary' }}>
                  INPUT LEVEL
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: listening ? 'primary.main' : 'text.disabled' }}>
                  {listening ? 'Listening...' : 'Idle'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.4}>
                {Array.from({ length: SEGMENTS }, (_, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      height: 10,
                      borderRadius: 0.6,
                      bgcolor: listening && index < activeSegments
                        ? 'primary.main'
                        : alpha('#64748B', 0.14),
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Button
              variant="outlined"
              startIcon={<MicOutlined />}
              onClick={() => (listening ? stopMic() : startMic(prefs))}
              disabled={testingMic}
              sx={actionBtnSx}
            >
              {listening ? 'Stop mic' : 'Test mic'}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={cardSx}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.25 }}>
              <CardIcon icon={HeadphonesOutlined} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>Speaker</Typography>
                <Typography variant="body2" color="text.secondary">Plays conference audio and alerts.</Typography>
              </Box>
            </Stack>

            <DeviceSelect
              label="System default"
              value={prefs.speakerId}
              options={speakers}
              fallback="Speaker"
              onChange={(value) => handleDeviceChange('speakerId', value)}
            />
            {speakers.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.25, display: 'block' }}>
                This browser may not list speakers. Meetings will use the system default output.
              </Typography>
            )}

            <Button
              variant="outlined"
              startIcon={<HeadphonesOutlined />}
              onClick={testSpeaker}
              disabled={testingSpeaker}
              sx={actionBtnSx}
            >
              {testingSpeaker ? 'Playing…' : 'Test speaker'}
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={cardSx}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2.25 }}>
              <CardIcon icon={VideocamOutlined} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>Camera</Typography>
                <Typography variant="body2" color="text.secondary">Used for video calls and camera capture.</Typography>
              </Box>
            </Stack>

            <DeviceSelect
              label="System default"
              value={prefs.cameraId}
              options={cameras}
              fallback="Camera"
              onChange={(value) => handleDeviceChange('cameraId', value)}
            />

            <Box
              sx={{
                mt: 2,
                mb: 2,
                minHeight: 140,
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                component="video"
                ref={videoRef}
                autoPlay
                muted
                playsInline
                sx={{
                  display: previewOn ? 'block' : 'none',
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  bgcolor: 'background.paper',
                }}
              />
              {!previewOn && (
                <Stack
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    px: 2,
                    textAlign: 'center',
                  }}
                >
                  <VideocamOffOutlined sx={{ fontSize: 28, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {testingCamera ? 'Starting camera…' : 'Click Test camera to preview'}
                  </Typography>
                </Stack>
              )}
            </Box>

            <Button
              variant="outlined"
              startIcon={<VideocamOutlined />}
              onClick={() => (previewOn ? stopCamera() : startCamera(prefs))}
              disabled={testingCamera}
              sx={actionBtnSx}
            >
              {previewOn ? 'Stop camera' : 'Test camera'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MediaDeviceSetup;
