const mongoose = require('mongoose');

// Refresh tokens emitidos. Se guarda solo el hash y se marca como revocado al usarlo o al cerrar sesión.
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null }
  },
  { versionKey: '__v', timestamps: true }
);

// El índice TTL borra el registro cuando caduca
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema, 'refreshTokens');
