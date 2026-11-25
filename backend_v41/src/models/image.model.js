const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value) => /^https?:\/\/\S+$/i.test(value),
        message: 'url must be a valid http or https URL'
      }
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ''
    },
    concertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concert',
      default: null
    },
    performanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Performance',
      default: null
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      default: null
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: null
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
    timestamps: true
  }
);

imageSchema.index({ concertId: 1 });
imageSchema.index({ performanceId: 1 });
imageSchema.index({ categoryId: 1 });
imageSchema.index({ venueId: 1 });

imageSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Image = mongoose.model('Image', imageSchema, 'images');

module.exports = Image;
