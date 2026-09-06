const {
  initMediasoup,
  addPeer,
  removePeer,
  getRouterRtpCapabilities,
  createWebRtcTransport,
  connectTransport,
  produce,
  consume,
  resumeConsumer,
  listExistingProducers,
  getPeer,
} = require('./mediasoupService');
const { buildIceServers } = require('./turnService');
const webrtcConfig = require('../config/webrtc');

const conferenceRoom = (conferenceId) => `conference:${conferenceId}`;

const ackOk = (cb, data) => { if (typeof cb === 'function') cb({ ok: true, ...data }); };
const ackErr = (cb, message) => { if (typeof cb === 'function') cb({ ok: false, message }); };

const registerMediasoupHandlers = (io, socket) => {
  const peerId = socket.id;
  let activeConferenceId = null;

  socket.on('ms:join', async (payload, cb) => {
    try {
      const { conferenceId, displayName } = payload || {};
      if (!conferenceId) return ackErr(cb, 'conferenceId required');

      activeConferenceId = String(conferenceId);
      await initMediasoup();

      await addPeer(activeConferenceId, peerId, {
        userId: socket.user.id,
        displayName: displayName || socket.user.username,
        role: socket.user.role,
      });

      socket.join(conferenceRoom(conferenceId));

      const rtpCapabilities = await getRouterRtpCapabilities(activeConferenceId);
      const existingProducers = listExistingProducers(activeConferenceId, peerId);

      ackOk(cb, {
        rtpCapabilities,
        existingProducers,
        peerId,
        iceServers: buildIceServers(),
        iceTransportPolicy: webrtcConfig.iceTransportPolicy,
      });
    } catch (err) {
      console.error('[ms:join]', err.message);
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:createTransport', async (payload, cb) => {
    try {
      const { conferenceId, direction } = payload || {};
      const transport = await createWebRtcTransport(conferenceId, peerId, direction);
      ackOk(cb, { transport, iceServers: buildIceServers() });
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:connectTransport', async (payload, cb) => {
    try {
      await connectTransport(payload.conferenceId, peerId, payload);
      ackOk(cb, {});
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:produce', async (payload, cb) => {
    try {
      const { conferenceId, transportId, kind, rtpParameters } = payload;
      const result = await produce(conferenceId, peerId, { transportId, kind, rtpParameters });
      const { peer } = getPeer(conferenceId, peerId);

      socket.to(conferenceRoom(conferenceId)).emit('ms:newProducer', {
        producerId: result.id,
        peerId,
        userId: peer?.userId,
        displayName: peer?.displayName,
        role: peer?.role,
        kind: result.kind,
      });

      ackOk(cb, result);
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:consume', async (payload, cb) => {
    try {
      const consumer = await consume(payload.conferenceId, peerId, payload);
      ackOk(cb, { consumer });
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:resumeConsumer', async (payload, cb) => {
    try {
      await resumeConsumer(payload.conferenceId, peerId, payload.consumerId);
      ackOk(cb, {});
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  socket.on('ms:listProducers', (payload, cb) => {
    try {
      const conferenceId = payload?.conferenceId || activeConferenceId;
      ackOk(cb, { producers: listExistingProducers(conferenceId, peerId) });
    } catch (err) {
      ackErr(cb, err.message);
    }
  });

  const cleanup = () => {
    if (!activeConferenceId) return;
    removePeer(activeConferenceId, peerId);
    socket.to(conferenceRoom(activeConferenceId)).emit('ms:peerLeft', { peerId });
    activeConferenceId = null;
  };

  socket.on('ms:leave', cleanup);
  socket.on('disconnect', cleanup);
};

module.exports = { registerMediasoupHandlers, conferenceRoom };
