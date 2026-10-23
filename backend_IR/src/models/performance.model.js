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
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
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

// Datos del concierto al que pertenece la sesión (solo cuando se hace populate)
performanceSchema.virtual('concert', {
  ref: 'Concert',
  localField: 'concertId',
  foreignField: '_id',
  justOne: true
});

// Sala donde se celebra la sesión (solo cuando se hace populate). El aforo viene de la sala.
performanceSchema.virtual('venue', {
  ref: 'Venue',
  localField: 'venueId',
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
performanceSchema.index({ venueId: 1 });

performanceSchema.pre(/^find/, function preFind(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }

  next();
});

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance;
