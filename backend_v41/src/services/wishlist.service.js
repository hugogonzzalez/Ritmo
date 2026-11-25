const AppError = require('../utils/app-error');
const variantRepository = require('../repositories/variant.repository');
const wishlistRepository = require('../repositories/wishlist.repository');

// Formato que sale de la API: una fila plana con la entrada, la sesión y el concierto
const formatear = (fila) => {
  const variante = fila.variant;
  const sesion = variante.performanceId;
  const concierto = sesion.concertId;
  return {
    _id: fila._id,
    variantId: variante._id,
    variantName: variante.name,
    price: variante.price,
    city: sesion.city,
    startsAt: sesion.startsAt,
    concertId: concierto._id,
    concertTitle: concierto.title,
    concertSlug: concierto.slug,
    concertImage: concierto.images?.[0] ?? null,
    createdAt: fila.createdAt
  };
};

// Solo se muestran las filas cuya entrada, sesión y concierto siguen existiendo
const esValida = (fila) => Boolean(fila.variant?.performanceId?.concertId);

const listar = async (usuarioId) => {
  const filas = await wishlistRepository.findByUser(usuarioId);
  return filas.filter(esValida).map(formatear);
};

const agregar = async (usuarioId, variantId) => {
  const variante = await variantRepository.findById(variantId);
  if (!variante) throw new AppError('La entrada no existe', 404);

  const existente = await wishlistRepository.findByUserAndVariant(usuarioId, variantId);
  if (existente) throw new AppError('Esta entrada ya está en tu lista de deseos', 409);

  try {
    await wishlistRepository.create({ user: usuarioId, variant: variantId });
  } catch (error) {
    // Si llegan dos peticiones a la vez, el índice único también lo impide
    if (error.code === 11000) throw new AppError('Esta entrada ya está en tu lista de deseos', 409);
    throw error;
  }

  return { variantId: String(variantId) };
};

const quitar = async (usuarioId, variantId) => {
  const resultado = await wishlistRepository.deleteByUserAndVariant(usuarioId, variantId);
  if (resultado.deletedCount === 0) throw new AppError('Esa entrada no está en tu lista de deseos', 404);

  return { variantId: String(variantId) };
};

module.exports = { listar, agregar, quitar };
