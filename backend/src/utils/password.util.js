const argon2 = require('argon2');

// Argon2id (recomendado por OWASP). Nunca se guarda la contraseña en texto plano.
const HASH_OPTIONS = { type: argon2.argon2id };

const hashPassword = (password) => argon2.hash(password, HASH_OPTIONS);

// argon2.verify lanza error si el hash no tiene formato válido: en ese caso la contraseña no es válida
const verifyPassword = async (password, passwordHash) => {
  try {
    return await argon2.verify(passwordHash, password);
  } catch (error) {
    return false;
  }
};

module.exports = { hashPassword, verifyPassword };
