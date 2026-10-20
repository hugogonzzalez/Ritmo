const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    concertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Concert',
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
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
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    bookedParticipants: {
      type: Number,
      default: 0,
      min: 0
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
    images: {
      type: [String],
      default: []
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
    versionKey: '__v',
    toJSON: { virtuals: true }
  }
);

// Datos del concierto al que pertenece la sesión (solo cuando se hace populate)
performanceSchema.virtual('concert', {
  ref: 'Concert',
  localField: 'concertId',
  foreignField: '_id',
  justOne: true
});

// Artistas del cartel de la sesión (solo cuando se hace populate)
performanceSchema.virtual('artists', {
  ref: 'Artist',
  localField: 'artistIds',
  foreignField: '_id',
  justOne: false
});

performanceSchema.index({ artistIds: 1 });

performanceSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance;
