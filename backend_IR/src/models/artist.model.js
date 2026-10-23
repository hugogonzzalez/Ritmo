const mongoose = require('mongoose');

const socialSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['instagram', 'spotify', 'youtube', 'x', 'web'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: (value) => /^https?:\/\/\S+$/i.test(value),
        message: 'social url must be a valid http or https URL'
      }
    }
  },
  { _id: false }
);

const artistSchema = new mongoose.Schema(
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
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ''
    },
    socials: {
      type: [socialSchema],
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
    timestamps: true
  }
);

artistSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Artist = mongoose.model('Artist', artistSchema, 'artists');

module.exports = Artist;
