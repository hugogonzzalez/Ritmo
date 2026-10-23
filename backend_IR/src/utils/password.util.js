const crypto = require('node:crypto');

const KEY_LENGTH = 64;

const derive = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
    if (error) reject(error);
    else resolve(derivedKey);
  });
});

// Formato guardado: scrypt$<salt>$<hash>. Nunca se guarda la contraseña en texto plano.
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await derive(password, salt);

  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, passwordHash) => {
  const [algorithm, salt, expected] = String(passwordHash).split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;

  const derivedKey = await derive(password, salt);
  const expectedBuffer = Buffer.from(expected, 'hex');

  return expectedBuffer.length === derivedKey.length && crypto.timingSafeEqual(derivedKey, expectedBuffer);
};

module.exports = { hashPassword, verifyPassword };
