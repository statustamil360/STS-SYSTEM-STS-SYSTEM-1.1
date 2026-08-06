const jwt = require('jsonwebtoken');
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn } = require('../config/jwt');

const generateAccessToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, jwtSecret);
const verifyRefreshToken = (token) => jwt.verify(token, jwtRefreshSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
