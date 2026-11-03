const RevokedToken = require('../models/revoked-token.model');

class RevokedTokenRepository {
  async revoke(jti, expiresAt) {
    return RevokedToken.updateOne(
      { jti },
      { $setOnInsert: { jti, expiresAt } },
      { upsert: true }
    );
  }

  async isRevoked(jti) {
    return RevokedToken.exists({ jti });
  }
}

module.exports = new RevokedTokenRepository();
