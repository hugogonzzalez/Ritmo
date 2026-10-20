const mongoose = require('mongoose');

const VENUE_STATUSES = ['active', 'maintenance', 'closed'];

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    // Referencias a images._id (claves ajenas)
    images: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
      default: []
    },
    website: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: ''
    },
    status: {
      type: String,
      enum: VENUE_STATUSES,
      default: 'active',
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

venueSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Venue = mongoose.model('Venue', venueSchema, 'venues');

module.exports = Venue;
module.exports.VENUE_STATUSES = VENUE_STATUSES;
