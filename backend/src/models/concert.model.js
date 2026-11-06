const mongoose = require('mongoose');

const concertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'full', 'cancelled', 'completed'],
      default: 'scheduled',
      trim: true
    },
    artistIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
      default: []
    },
    categoryIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      default: []
    },
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
    // Include populated virtuals (such as `artists`) in API JSON responses.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Artistas del concierto (solo cuando se hace populate)
concertSchema.virtual('artists', {
  ref: 'Artist',
  localField: 'artistIds',
  foreignField: '_id',
  justOne: false
});

// Categorías del concierto (solo cuando se hace populate)
concertSchema.virtual('categories', {
  ref: 'Category',
  localField: 'categoryIds',
  foreignField: '_id',
  justOne: false
});

concertSchema.index({ artistIds: 1 });
concertSchema.index({ categoryIds: 1 });

concertSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Concert = mongoose.model('Concert', concertSchema, 'concerts');

module.exports = Concert;
