const RefreshToken = require('../models/refresh-token.model');

class RefreshTokenRepository {
  async create({ userId, tokenHash, expiresAt }) {
    return RefreshToken.create({ userId, tokenHash, expiresAt });
  }

  // Solo válido si no está revocado y no ha caducado
  async findValidByHash(tokenHash) {
    return RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  }

  async revokeByHash(tokenHash) {
    return RefreshToken.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
}

module.exports = new RefreshTokenRepository();
