const mediasoup = require('mediasoup');
const webrtcConfig = require('../config/webrtc');

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: { 'x-google-start-bitrate': 1000 },
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
    },
  },
];

let worker = null;
const rooms = new Map();

const initMediasoup = async () => {
  if (worker) return worker;

  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: webrtcConfig.minPort,
    rtcMaxPort: webrtcConfig.maxPort,
  });

  worker.on('died', () => {
    console.error('[mediasoup] Worker died — exiting');
    process.exit(1);
  });

  console.log(`[mediasoup] Worker started (ports ${webrtcConfig.minPort}-${webrtcConfig.maxPort})`);
  return worker;
};

const getListenIps = () => [
  {
    ip: webrtcConfig.listenIp,
    announcedIp: webrtcConfig.announcedIp !== webrtcConfig.listenIp
      ? webrtcConfig.announcedIp
      : undefined,
  },
];

const getOrCreateRoom = async (conferenceId) => {
  const key = String(conferenceId);
  if (rooms.has(key)) return rooms.get(key);

  await initMediasoup();
  const router = await worker.createRouter({ mediaCodecs });
  const room = { router, peers: new Map() };
  rooms.set(key, room);
  return room;
};

const getRoom = (conferenceId) => rooms.get(String(conferenceId));

const addPeer = async (conferenceId, peerId, { userId, displayName, role }) => {
  const room = await getOrCreateRoom(conferenceId);
  const peer = {
    peerId,
    userId,
    displayName: displayName || 'Participant',
    role: role || 'other',
    producers: new Map(),
    consumers: new Map(),
  };
  room.peers.set(peerId, peer);
  return { room, peer };
};

const getPeer = (conferenceId, peerId) => {
  const room = getRoom(conferenceId);
  if (!room) return { room: null, peer: null };
  return { room, peer: room.peers.get(peerId) || null };
};

const removePeer = (conferenceId, peerId) => {
  const room = getRoom(conferenceId);
  if (!room) return;

  const peer = room.peers.get(peerId);
  if (!peer) return;

  peer.producers.forEach((p) => p.close());
  peer.consumers.forEach((c) => c.close());
  peer.sendTransport?.close();
  peer.recvTransport?.close();
  room.peers.delete(peerId);

  if (room.peers.size === 0) {
    room.router.close();
    rooms.delete(String(conferenceId));
  }
};

const createWebRtcTransport = async (conferenceId, peerId, direction) => {
  const { room, peer } = getPeer(conferenceId, peerId);
  if (!room || !peer) throw new Error('Peer not found');

  const transport = await room.router.createWebRtcTransport({
    listenIps: getListenIps(),
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 1_000_000,
  });

  if (direction === 'send') {
    peer.sendTransport?.close();
    peer.sendTransport = transport;
  } else {
    peer.recvTransport?.close();
    peer.recvTransport = transport;
  }

  transport.on('dtlsstatechange', (state) => {
    if (state === 'closed') transport.close();
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
};

const connectTransport = async (conferenceId, peerId, { transportId, dtlsParameters }) => {
  const { peer } = getPeer(conferenceId, peerId);
  if (!peer) throw new Error('Peer not found');

  const transport = peer.sendTransport?.id === transportId
    ? peer.sendTransport
    : peer.recvTransport?.id === transportId
      ? peer.recvTransport
      : null;

  if (!transport) throw new Error('Transport not found');
  await transport.connect({ dtlsParameters });
};

const produce = async (conferenceId, peerId, { transportId, kind, rtpParameters }) => {
  const { peer } = getPeer(conferenceId, peerId);
  if (!peer?.sendTransport || peer.sendTransport.id !== transportId) {
    throw new Error('Send transport not found');
  }

  const producer = await peer.sendTransport.produce({ kind, rtpParameters });
  peer.producers.set(producer.id, producer);

  producer.on('transportclose', () => {
    peer.producers.delete(producer.id);
  });

  return { id: producer.id, kind: producer.kind };
};

const consume = async (conferenceId, peerId, { producerId, rtpCapabilities }) => {
  const { room, peer } = getPeer(conferenceId, peerId);
  if (!room || !peer?.recvTransport) throw new Error('Receive transport not ready');

  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume producer');
  }

  const consumer = await peer.recvTransport.consume({
    producerId,
    rtpCapabilities,
    paused: true,
  });

  peer.consumers.set(consumer.id, consumer);

  consumer.on('transportclose', () => {
    peer.consumers.delete(consumer.id);
  });

  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
};

const resumeConsumer = async (conferenceId, peerId, consumerId) => {
  const { peer } = getPeer(conferenceId, peerId);
  const consumer = peer?.consumers.get(consumerId);
  if (!consumer) throw new Error('Consumer not found');
  await consumer.resume();
};

const listExistingProducers = (conferenceId, excludePeerId) => {
  const room = getRoom(conferenceId);
  if (!room) return [];

  const list = [];
  room.peers.forEach((peer, pid) => {
    if (pid === excludePeerId) return;
    peer.producers.forEach((producer) => {
      list.push({
        producerId: producer.id,
        peerId: pid,
        userId: peer.userId,
        displayName: peer.displayName,
        role: peer.role,
        kind: producer.kind,
      });
    });
  });
  return list;
};

const getRouterRtpCapabilities = async (conferenceId) => {
  const room = await getOrCreateRoom(conferenceId);
  return room.router.rtpCapabilities;
};

module.exports = {
  initMediasoup,
  getOrCreateRoom,
  getRoom,
  addPeer,
  getPeer,
  removePeer,
  createWebRtcTransport,
  connectTransport,
  produce,
  consume,
  resumeConsumer,
  listExistingProducers,
  getRouterRtpCapabilities,
};
