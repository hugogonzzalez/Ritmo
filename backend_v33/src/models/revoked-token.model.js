const mongoose = require('mongoose');

// Tokens cerrados con logout. El índice TTL borra cada registro cuando el token ya habría caducado.
const revokedTokenSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    versionKey: '__v',
    timestamps: true
  }
);

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema, 'revokedTokens');

module.exports = RevokedToken;
