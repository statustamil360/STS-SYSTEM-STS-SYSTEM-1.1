const errorHandler = (err, req, res, _next) => {
  console.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    const message = err.message?.includes('email')
      ? 'Email already exists'
      : err.message?.includes('username')
        ? 'Username already exists'
        : 'Duplicate entry';
    return res.status(409).json({ success: false, message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
