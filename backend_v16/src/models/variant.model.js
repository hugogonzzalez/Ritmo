const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40
    },
    // Clave ajena: performances._id
    performanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Performance',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer'
      }
    },
    sold: {
      type: Number,
      default: 0,
      min: 0
    },
    // URLs de las imágenes, igual que en conciertos, sesiones, artistas y categorías
    images: {
      type: [String],
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

// Datos de la sesión a la que pertenece la variante (solo cuando se hace populate)
variantSchema.virtual('performance', {
  ref: 'Performance',
  localField: 'performanceId',
  foreignField: '_id',
  justOne: true
});

variantSchema.pre('validate', function validateSold(next) {
  if (this.sold > this.quantity) {
    this.invalidate('sold', 'sold no puede ser mayor que quantity');
  }

  next();
});

variantSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Variant = mongoose.model('Variant', variantSchema, 'variants');

module.exports = Variant;
