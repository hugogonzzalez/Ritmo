const wishlistService = require('../services/wishlist.service');

// GET /api/wishlist
const listar = async (req, res, next) => {
  try {
    const data = await wishlistService.listar(req.user.id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// POST /api/wishlist/variant/:variantId
const agregar = async (req, res, next) => {
  try {
    const data = await wishlistService.agregar(req.user.id, req.params.variantId);
    return res.status(201).json({ success: true, message: 'Añadida a tu lista de deseos', data });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/wishlist/variant/:variantId
const quitar = async (req, res, next) => {
  try {
    const data = await wishlistService.quitar(req.user.id, req.params.variantId);
    return res.json({ success: true, message: 'Quitada de tu lista de deseos', data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listar, agregar, quitar };
