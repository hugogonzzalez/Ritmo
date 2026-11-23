const mongoose = require('mongoose');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// active: puede usar la app; blocked: bloqueada por un administrador
const USER_STATUSES = ['active', 'blocked'];

const userSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [EMAIL_PATTERN, 'email no es válido']
    },
    // Hash de la contraseña (scrypt). No se selecciona por defecto ni se devuelve nunca.
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    // Clave ajena: roles._id
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    // Estado de la cuenta (distinto de isActive, que es el borrado lógico)
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'active'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    versionKey: '__v',
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// Datos del rol del usuario (solo cuando se hace populate)
userSchema.virtual('role', {
  ref: 'Role',
  localField: 'roleId',
  foreignField: '_id',
  justOne: true
});

userSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
module.exports.USER_STATUSES = USER_STATUSES;
