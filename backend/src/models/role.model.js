const mongoose = require('mongoose');

// Roles disponibles en la aplicación
const ROLE_NAMES = ['admin', 'customer'];

// Permisos que se pueden asignar a un rol
const PERMISSIONS = [
  'concerts:read',
  'concerts:manage',
  'performances:manage',
  'variants:manage',
  'categories:manage',
  'users:manage',
  'purchases:create',
  'orders:read-own'
];

const roleSchema = new mongoose.Schema(
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
      unique: true,
      trim: true,
      lowercase: true,
      enum: ROLE_NAMES
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ''
    },
    permissions: {
      type: [{ type: String, enum: PERMISSIONS }],
      default: []
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
    toJSON: { virtuals: true }
  }
);

roleSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Role = mongoose.model('Role', roleSchema, 'roles');

module.exports = Role;
module.exports.ROLE_NAMES = ROLE_NAMES;
module.exports.PERMISSIONS = PERMISSIONS;
