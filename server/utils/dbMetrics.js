const MAX_SAMPLES = 60;

const state = {
  totalQueries: 0,
  totalDurationMs: 0,
  totalRows: 0,
  errors: 0,
  samples: [],
};

const pushSample = (sample) => {
  state.samples.push(sample);
  if (state.samples.length > MAX_SAMPLES) state.samples.shift();
};

exports.recordQuery = ({ durationMs, rowCount = 0, error = false }) => {
  state.totalQueries += 1;
  state.totalDurationMs += durationMs;
  state.totalRows += rowCount;
  if (error) state.errors += 1;
  pushSample({
    t: Date.now(),
    durationMs,
    rowCount,
    error,
  });
};

exports.getDbMetrics = () => {
  const recent = state.samples.slice(-20);
  const windowMs = recent.length >= 2
    ? Math.max(recent[recent.length - 1].t - recent[0].t, 1000)
    : 1000;
  const queriesInWindow = recent.length;
  const qps = Number((queriesInWindow / (windowMs / 1000)).toFixed(2));
  const avgDuration = recent.length
    ? Math.round(recent.reduce((s, r) => s + r.durationMs, 0) / recent.length)
    : 0;
  const rowsInWindow = recent.reduce((s, r) => s + (r.rowCount || 0), 0);

  return {
    totalQueries: state.totalQueries,
    totalDurationMs: state.totalDurationMs,
    totalRows: state.totalRows,
    errors: state.errors,
    qps,
    avgDurationMs: avgDuration,
    rowsPerSecond: Number((rowsInWindow / (windowMs / 1000)).toFixed(1)),
    timeline: state.samples.map((s) => ({
      time: s.t,
      durationMs: s.durationMs,
      rowCount: s.rowCount,
    })),
  };
};

exports.resetDbMetrics = () => {
  state.totalQueries = 0;
  state.totalDurationMs = 0;
  state.totalRows = 0;
  state.errors = 0;
  state.samples = [];
};
