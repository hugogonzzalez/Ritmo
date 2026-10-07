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
    venue: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    date: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
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
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    versionKey: '__v'
  }
);

concertSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Concert = mongoose.model('Concert', concertSchema, 'experiences');

module.exports = Concert;