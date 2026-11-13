const mongoose = require('mongoose');

// Datos extendidos del usuario. Relación 1:1 con User: Profile depende de User, no al revés.
const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    firstName: { type: String, trim: true, maxlength: 60, default: null },
    lastName: { type: String, trim: true, maxlength: 60, default: null },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    bio: { type: String, trim: true, maxlength: 500, default: null },
    avatarUrl: { type: String, trim: true, maxlength: 500, default: null },
    // Sigue el estado activo del usuario al que pertenece
    isActive: { type: Boolean, default: true }
  },
  {
    versionKey: '__v',
    timestamps: true
  }
);

const Profile = mongoose.model('Profile', profileSchema, 'profiles');

module.exports = Profile;
