import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api';

const MIME_CANDIDATES = [
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm',
];

const pickMime = () => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const useMeetingRecorder = ({ conferenceId, enabled, localStream, remotePeers }) => {
  const streamsRef = useRef({ local: null, remotes: [] });
  streamsRef.current = { local: localStream, remotes: remotePeers || [] };
  const flushRef = useRef(async () => {});

  useEffect(() => {
    if (!enabled || !conferenceId) {
      flushRef.current = async () => {};
      return undefined;
    }
    const mime = pickMime();
    if (!mime) {
      console.warn('[recording] MediaRecorder is not supported in this browser');
      flushRef.current = async () => {};
      return undefined;
    }

    let recorder = null;
    let audioCtx = null;
    let oscillator = null;
    let raf = 0;
    let audioTimer = 0;
    let drawing = true;
    let flushed = false;
    const connectedAudio = new Set();
    const videos = new Map();
    const pending = new Set();

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:-9999px;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

    const getStreams = () => {
      const { local, remotes } = streamsRef.current;
      const list = [];
      if (local) list.push({ id: 'local', stream: local });
      remotes.forEach((peer) => {
        if (peer?.stream) list.push({ id: peer.peerId, stream: peer.stream });
      });
      return list;
    };

    const ensureVideo = (id, stream) => {
      let el = videos.get(id);
      if (!el) {
        el = document.createElement('video');
        el.muted = true;
        el.playsInline = true;
        el.autoplay = true;
        videos.set(id, el);
      }
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
      return el;
    };

    const draw = () => {
      if (!drawing || !ctx) return;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const items = getStreams().filter((item) => (
        item.stream.getVideoTracks().some((track) => track.readyState === 'live')
      ));
      if (!items.length) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '32px sans-serif';
        ctx.fillText('Recording meeting…', 48, 80);
      } else {
        const cols = items.length <= 1 ? 1 : items.length <= 4 ? 2 : 3;
        const rows = Math.ceil(items.length / cols);
        const width = canvas.width / cols;
        const height = canvas.height / rows;
        items.forEach((item, index) => {
          const el = ensureVideo(item.id, item.stream);
          const col = index % cols;
          const row = Math.floor(index / cols);
          try {
            ctx.drawImage(el, col * width, row * height, width, height);
          } catch {
            // frame not ready
          }
        });
      }
      raf = requestAnimationFrame(draw);
    };

    const connectAudio = () => {
      if (!audioCtx || audioCtx.state === 'closed') return;
      getStreams().forEach((item) => {
        item.stream.getAudioTracks().forEach((track) => {
          const key = `${item.id}:${track.id}`;
          if (connectedAudio.has(key) || track.readyState !== 'live') return;
          connectedAudio.add(key);
          try {
            const src = audioCtx.createMediaStreamSource(new MediaStream([track]));
            src.connect(audioCtx.destinationNode);
          } catch {
            connectedAudio.delete(key);
          }
        });
      });
    };

    const uploadChunk = (blob) => {
      if (!blob?.size) return Promise.resolve();
      const form = new FormData();
      form.append('chunk', blob, 'chunk.webm');
      const task = api.post(`/conferences/${conferenceId}/recording-chunks`, form)
        .catch((err) => {
          console.warn('[recording] chunk upload failed', err.response?.data?.message || err.message);
        })
        .finally(() => pending.delete(task));
      pending.add(task);
      return task;
    };

    const start = async () => {
      if (recorder) return;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '32px sans-serif';
      ctx.fillText('Recording meeting…', 48, 80);

      const mixed = canvas.captureStream(8);
      try {
        audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        audioCtx.destinationNode = dest;
        const gain = audioCtx.createGain();
        gain.gain.value = 0.0001;
        oscillator = audioCtx.createOscillator();
        oscillator.connect(gain);
        gain.connect(dest);
        oscillator.start();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
        }
        dest.stream.getAudioTracks().forEach((track) => mixed.addTrack(track));
        connectAudio();
        audioTimer = window.setInterval(connectAudio, 1500);
      } catch (err) {
        console.warn('[recording] audio mix unavailable', err.message);
      }

      recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: 600000 });
      recorder.ondataavailable = (event) => {
        if (event.data?.size) uploadChunk(event.data);
      };
      draw();
      recorder.start(1000);
    };

    const teardownMedia = () => {
      drawing = false;
      window.clearInterval(audioTimer);
      cancelAnimationFrame(raf);
      try { oscillator?.stop(); } catch { /* ignore */ }
      try { audioCtx?.close(); } catch { /* ignore */ }
      videos.forEach((el) => { el.srcObject = null; });
      videos.clear();
      canvas.remove();
    };

    flushRef.current = async () => {
      if (flushed) return;
      flushed = true;
      try {
        if (recorder && recorder.state !== 'inactive') {
          await new Promise((resolve) => {
            const finish = () => resolve();
            recorder.addEventListener('stop', finish, { once: true });
            try {
              if (recorder.state === 'recording') recorder.requestData();
              recorder.stop();
            } catch {
              finish();
            }
            setTimeout(finish, 4000);
          });
        }
        await Promise.allSettled([...pending]);
      } catch {
        // best-effort flush
      }
    };

    start().catch((err) => console.warn('[recording] start failed', err.message));

    return () => {
      const flush = flushRef.current;
      flushRef.current = async () => {};
      void flush().finally(teardownMedia);
    };
  }, [enabled, conferenceId]);

  const flush = useCallback(() => flushRef.current(), []);

  return { flush };
};

export default useMeetingRecorder;
