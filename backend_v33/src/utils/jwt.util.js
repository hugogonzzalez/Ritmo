const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('./app-error');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('Falta la configuración JWT (JWT_SECRET)', 500);
  }

  return process.env.JWT_SECRET;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '1h';

// jti: identificador único del token, necesario para revocarlo en logout
const signAccessToken = (payload) => jwt.sign(payload, getJwtSecret(), {
  expiresIn: getJwtExpiresIn(),
  jwtid: randomUUID()
});

const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = { signAccessToken, verifyAccessToken, getJwtExpiresIn };
