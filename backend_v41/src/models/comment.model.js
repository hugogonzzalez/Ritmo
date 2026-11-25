const mongoose = require('mongoose');

// Valoración y comentario que deja un cliente sobre una variante (tipo de entrada de una sesión).
// Como cada variante pertenece a una sesión (ciudad y fecha), las valoraciones de Valencia y Barcelona quedan separadas.
const commentSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: {
      type: Number,
      required: true,
      validate: { validator: Number.isInteger, message: 'rating must be an integer' },
      min: 1,
      max: 5
    },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 }
  },
  { timestamps: true, versionKey: false }
);

// Cada cliente solo puede valorar una variante una vez (puede editar o borrar esa valoración)
commentSchema.index({ variant: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Comment', commentSchema, 'comments');
