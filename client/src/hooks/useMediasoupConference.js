import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { getMediaConstraints } from '../utils/mediaDevices';

const ICE_TIMEOUT_MS = 25000;

const getSocketUrl = () => {
  const api = import.meta.env.VITE_API_URL || '/api';
  if (api.startsWith('http')) {
    return api.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

const socketRequest = (socket, event, payload) => new Promise((resolve, reject) => {
  socket.emit(event, payload, (res) => {
    if (res?.ok) resolve(res);
    else reject(new Error(res?.message || `${event} failed`));
  });
});

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  }),
]);

const captureLocalMedia = () => {
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
  if (!getUserMedia) {
    const host = window.location.hostname;
    const httpsUrl = `https://${host}${window.location.port ? `:${window.location.port}` : ''}${window.location.pathname}`;
    if (!window.isSecureContext) {
      throw new Error(
        `Camera and microphone need HTTPS on this PC. Open ${httpsUrl} and click Advanced → Continue (self-signed certificate).`
      );
    }
    throw new Error('Camera and microphone are not available in this browser.');
  }
  return getUserMedia(getMediaConstraints());
};

const useMediasoupConference = ({
  conferenceId,
  iceServers,
  displayName,
  enabled = true,
}) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producersRef = useRef(new Map());
  const consumersRef = useRef(new Map());
  const peerStreamsRef = useRef(new Map());
  const peerMetaRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const iceServersRef = useRef(iceServers);
  const displayNameRef = useRef(displayName);
  const joinIcePolicyRef = useRef('relay');

  iceServersRef.current = iceServers;
  displayNameRef.current = displayName;

  const syncRemotePeers = useCallback(() => {
    const peers = [];
    peerStreamsRef.current.forEach((stream, peerId) => {
      const meta = peerMetaRef.current.get(peerId) || {};
      peers.push({
        peerId,
        displayName: meta.displayName || 'Participant',
        role: meta.role || 'other',
        stream,
        videoTrackCount: stream.getVideoTracks().filter((t) => t.readyState !== 'ended').length,
      });
    });
    setRemotePeers(peers);
  }, []);

  const addRemoteTrack = useCallback((peerId, track, meta = {}) => {
    if (meta.displayName) {
      peerMetaRef.current.set(peerId, {
        displayName: meta.displayName,
        role: meta.role || 'other',
      });
    }

    let stream = peerStreamsRef.current.get(peerId);
    if (!stream) {
      stream = new MediaStream();
      peerStreamsRef.current.set(peerId, stream);
    }

    const existing = stream.getTracks().find((t) => t.kind === track.kind);
    if (existing === track) {
      syncRemotePeers();
      return;
    }
    if (existing) {
      stream.removeTrack(existing);
    }
    stream.addTrack(track);
    peerStreamsRef.current.set(peerId, new MediaStream(stream.getTracks()));
    syncRemotePeers();
  }, [syncRemotePeers]);

  const removeRemotePeer = useCallback((peerId) => {
    const stream = peerStreamsRef.current.get(peerId);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    peerStreamsRef.current.delete(peerId);
    peerMetaRef.current.delete(peerId);

    [...consumersRef.current.entries()].forEach(([id, consumer]) => {
      if (consumer.appData?.peerId === peerId) {
        consumer.close();
        consumersRef.current.delete(id);
      }
    });

    syncRemotePeers();
  }, [syncRemotePeers]);

  const consumeProducer = useCallback(async (socket, producer) => {
    const device = deviceRef.current;
    const recvTransport = recvTransportRef.current;
    if (!device || !recvTransport || !producer?.producerId) return;

    const already = [...consumersRef.current.values()].some(
      (c) => c.producerId === producer.producerId
    );
    if (already) return;

    const { consumer } = await socketRequest(socket, 'ms:consume', {
      conferenceId,
      producerId: producer.producerId,
      rtpCapabilities: device.rtpCapabilities,
    });

    const msConsumer = await recvTransport.consume({
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    });
    msConsumer.appData = { peerId: producer.peerId };

    consumersRef.current.set(msConsumer.id, msConsumer);
    await socketRequest(socket, 'ms:resumeConsumer', {
      conferenceId,
      consumerId: msConsumer.id,
    });

    const track = msConsumer.track;
    const attach = () => addRemoteTrack(producer.peerId, track, producer);
    attach();
    track.addEventListener('unmute', attach);
  }, [conferenceId, addRemoteTrack]);

  const createTransport = useCallback(async (socket, direction, servers) => {
    const { transport, iceServers: socketIce } = await socketRequest(socket, 'ms:createTransport', {
      conferenceId,
      direction,
    });

    const resolvedIce = socketIce?.length ? socketIce : servers;
    const device = deviceRef.current;
    const isSend = direction === 'send';
    const transportOptions = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      iceServers: resolvedIce?.length ? resolvedIce : undefined,
      iceTransportPolicy: joinIcePolicyRef.current || 'relay',
    };

    const msTransport = isSend
      ? device.createSendTransport(transportOptions)
      : device.createRecvTransport(transportOptions);

    msTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socketRequest(socket, 'ms:connectTransport', {
        conferenceId,
        transportId: msTransport.id,
        dtlsParameters,
      })
        .then(() => callback())
        .catch(errback);
    });

    msTransport.on('connectionstatechange', (state) => {
      if (state === 'failed') {
        console.error(`[mediasoup] ${direction} ICE failed`);
      }
    });

    if (isSend) {
      msTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
        socketRequest(socket, 'ms:produce', {
          conferenceId,
          transportId: msTransport.id,
          kind,
          rtpParameters,
        })
          .then(({ id }) => callback({ id }))
          .catch(errback);
      });
      sendTransportRef.current = msTransport;
    } else {
      recvTransportRef.current = msTransport;
    }
  }, [conferenceId]);

  const cleanup = useCallback(() => {
    producersRef.current.forEach((p) => p.close());
    producersRef.current.clear();
    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    peerStreamsRef.current.forEach((stream) => {
      stream.getTracks().forEach((t) => t.stop());
    });
    peerStreamsRef.current.clear();
    peerMetaRef.current.clear();
    setRemotePeers([]);

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('ms:leave');
      socket.disconnect();
    }
    socketRef.current = null;
    deviceRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled || !conferenceId) return undefined;

    let cancelled = false;

    const connect = async () => {
      setStatus('connecting');
      setError(null);

      try {
        const token = localStorage.getItem('accessToken');
        const socket = io(getSocketUrl(), {
          path: '/socket.io',
          auth: { token },
          transports: ['polling', 'websocket'],
        });
        socketRef.current = socket;

        await new Promise((resolve, reject) => {
          socket.once('connect', resolve);
          socket.once('connect_error', (err) => reject(err));
        });

        if (cancelled) return;

        const joinRes = await socketRequest(socket, 'ms:join', {
          conferenceId,
          displayName: displayNameRef.current,
        });

        const resolvedIce = joinRes.iceServers?.length
          ? joinRes.iceServers
          : iceServersRef.current;
        joinIcePolicyRef.current = joinRes.iceTransportPolicy === 'all' ? 'all' : 'relay';
        console.info(
          '[mediasoup] ICE policy',
          joinIcePolicyRef.current,
          'servers',
          Array.isArray(resolvedIce) ? resolvedIce.length : 0
        );

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: joinRes.rtpCapabilities });
        deviceRef.current = device;

        await createTransport(socket, 'recv', resolvedIce);
        await createTransport(socket, 'send', resolvedIce);

        socket.on('ms:newProducer', (producer) => {
          consumeProducer(socket, producer).catch((err) => {
            console.error('[mediasoup] consume failed', err);
          });
        });

        socket.on('ms:peerLeft', ({ peerId }) => {
          removeRemotePeer(peerId);
        });

        for (const producer of joinRes.existingProducers || []) {
          await consumeProducer(socket, producer);
        }

        const stream = await captureLocalMedia();

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        const sendTransport = sendTransportRef.current;
        const vp8 = device.rtpCapabilities.codecs.find(
          (codec) => codec.mimeType.toLowerCase() === 'video/vp8'
        );
        for (const track of stream.getTracks()) {
          const producer = await withTimeout(
            sendTransport.produce({
              track,
              ...(track.kind === 'video' && vp8 ? { codec: vp8 } : {}),
            }),
            ICE_TIMEOUT_MS,
            'Could not reach the video server (ICE timeout). Open UDP and TCP 40000–49999 on the VPS firewall, then restart Node.'
          );
          producersRef.current.set(producer.id, producer);
        }

        const consumeAll = async () => {
          const { producers } = await socketRequest(socket, 'ms:listProducers', { conferenceId });
          for (const producer of producers || []) {
            await consumeProducer(socket, producer);
          }
        };
        await consumeAll();
        setTimeout(() => {
          if (!cancelled) consumeAll().catch(() => {});
        }, 2000);

        if (!cancelled) setStatus('connected');
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to connect to video room');
          setStatus('error');
          cleanup();
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [conferenceId, enabled, createTransport, consumeProducer, removeRemotePeer, cleanup]);

  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  }, []);

  const leave = useCallback(() => {
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  return {
    status,
    error,
    localStream,
    remotePeers,
    micOn,
    camOn,
    toggleMic,
    toggleCam,
    leave,
  };
};

export default useMediasoupConference;
