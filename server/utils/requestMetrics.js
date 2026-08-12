const MAX_SAMPLES = 60;

const state = {
  totalRequests: 0,
  totalBytes: 0,
  samples: [],
};

const pushSample = (sample) => {
  state.samples.push(sample);
  if (state.samples.length > MAX_SAMPLES) state.samples.shift();
};

exports.recordRequest = ({ durationMs, bytes = 0, path = '' }) => {
  state.totalRequests += 1;
  state.totalBytes += bytes;
  pushSample({
    t: Date.now(),
    durationMs,
    bytes,
    path,
  });
};

exports.getRequestMetrics = () => {
  const recent = state.samples.slice(-20);
  const windowMs = recent.length >= 2
    ? Math.max(recent[recent.length - 1].t - recent[0].t, 1000)
    : 1000;
  const rps = Number((recent.length / (windowMs / 1000)).toFixed(2));
  const bytesPerSec = Math.round(recent.reduce((s, r) => s + r.bytes, 0) / (windowMs / 1000));
  const avgDuration = recent.length
    ? Math.round(recent.reduce((s, r) => s + r.durationMs, 0) / recent.length)
    : 0;

  return {
    totalRequests: state.totalRequests,
    totalBytes: state.totalBytes,
    rps,
    bytesPerSec,
    avgDurationMs: avgDuration,
    timeline: state.samples.map((s) => ({
      time: s.t,
      durationMs: s.durationMs,
      bytes: s.bytes,
    })),
  };
};
