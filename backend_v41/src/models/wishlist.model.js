const mongoose = require('mongoose');

// Lista de deseos de un cliente: entradas (variantes) que quiere comprar más tarde.
// Cada entrada pertenece a una sesión, así que en la lista se ve la ciudad y la fecha.
const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true }
  },
  { timestamps: true, versionKey: false }
);

// Control de duplicados: un cliente no puede tener la misma entrada dos veces en su lista
wishlistSchema.index({ user: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema, 'wishlists');
