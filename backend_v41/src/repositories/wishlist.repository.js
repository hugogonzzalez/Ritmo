const Wishlist = require('../models/wishlist.model');

class WishlistRepository {
  // Lista del cliente con los datos de la entrada, la sesión y el concierto (lo más reciente primero)
  findByUser(usuarioId) {
    return Wishlist.find({ user: usuarioId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'variant',
        select: 'name price performanceId',
        populate: {
          path: 'performanceId',
          select: 'city startsAt concertId',
          populate: { path: 'concertId', select: 'title slug images' }
        }
      })
      .lean();
  }

  findByUserAndVariant(usuarioId, variantId) {
    return Wishlist.findOne({ user: usuarioId, variant: variantId }).lean();
  }

  create(datos) {
    return Wishlist.create(datos);
  }

  deleteByUserAndVariant(usuarioId, variantId) {
    return Wishlist.deleteOne({ user: usuarioId, variant: variantId });
  }
}

module.exports = new WishlistRepository();
