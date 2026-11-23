const { randomBytes, createHash } = require('crypto');

// El refresh token dura 15 días
const REFRESH_TTL_MS = 15 * 24 * 60 * 60 * 1000;

// Token aleatorio que se entrega al navegador dentro de una cookie httpOnly
const generarRefreshToken = () => randomBytes(48).toString('hex');

// En la base de datos solo guardamos el hash: si alguien roba la base de datos, no puede usar los tokens
const hashRefreshToken = (token) => createHash('sha256').update(token).digest('hex');

module.exports = { REFRESH_TTL_MS, generarRefreshToken, hashRefreshToken };
