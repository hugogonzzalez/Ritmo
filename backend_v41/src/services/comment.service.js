const AppError = require('../utils/app-error');
const { ADMIN_ROLE } = require('../utils/role.util');
const concertRepository = require('../repositories/concert.repository');
const variantRepository = require('../repositories/variant.repository');
const commentRepository = require('../repositories/comment.repository');

// Formato que sale de la API: el autor aparece solo con su nombre y su foto de perfil
const formatear = (comentario, avatares = new Map()) => ({
  _id: comentario._id,
  variant: comentario.variant,
  rating: comentario.rating,
  text: comentario.text,
  author: comentario.user
    ? { _id: comentario.user._id, name: comentario.user.name, avatarUrl: avatares.get(String(comentario.user._id)) ?? null }
    : null,
  createdAt: comentario.createdAt,
  updatedAt: comentario.updatedAt
});

const asegurarVariante = async (variantId) => {
  const variante = await variantRepository.findById(variantId);
  if (!variante) throw new AppError('La variante no existe', 404);
  return variante;
};

const asegurarComentario = async (id) => {
  const comentario = await commentRepository.findById(id);
  if (!comentario) throw new AppError('El comentario no existe', 404);
  return comentario;
};

// Lectura pública: valoración media de la variante y sus comentarios
const listarPorVariante = async (variantId) => {
  await asegurarVariante(variantId);

  const [comentarios, valoracion] = await Promise.all([
    commentRepository.findByVariant(variantId),
    commentRepository.statsByVariant(variantId)
  ]);

  const ids = comentarios.map((c) => c.user?._id).filter(Boolean);
  const avatares = await commentRepository.findAvatarsByUserIds(ids);

  return { valoracion, comentarios: comentarios.map((c) => formatear(c, avatares)) };
};

// Resumen público de un concierto: media de todas sus variantes (sin lista de comentarios)
const resumenPorConcierto = async (concertId) => {
  const concierto = await concertRepository.findById(concertId);
  if (!concierto) throw new AppError('El concierto no existe', 404);

  return { valoracion: await commentRepository.statsByConcert(concertId) };
};

// Lista paginada de todas las valoraciones (solo admin, para el dashboard)
const listarParaAdmin = async (query = {}) => {
  const paginaActual = Math.max(1, Number(query.page) || 1);
  const porPagina = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const filtros = {
    q: typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '',
    concertId: typeof query.concertId === 'string' && /^[a-f\d]{24}$/i.test(query.concertId) ? query.concertId : null,
    rating: [1, 2, 3, 4, 5].includes(Number(query.rating)) ? Number(query.rating) : null,
    orden: query.sort === 'asc' ? 'asc' : 'desc'
  };
  const { items, total } = await commentRepository.findPageForAdmin(paginaActual, porPagina, filtros);

  return {
    data: items,
    pagination: { total, page: paginaActual, limit: porPagina, totalPages: Math.max(1, Math.ceil(total / porPagina)) }
  };
};

// Textos de las valoraciones de un concierto (sin nombres de autores: el agente no los necesita)
const textosPorConcierto = async (concertId) => {
  const concierto = await concertRepository.findById(concertId);
  if (!concierto) throw new AppError('El concierto no existe', 404);

  const comentarios = await commentRepository.findTextosByConcert(concertId);
  return { titulo: concierto.title, comentarios };
};

// Solo clientes con sesión; una valoración por variante
const crear = async (variantId, usuarioId, { rating, text }) => {
  await asegurarVariante(variantId);

  const existente = await commentRepository.findByVariantAndUser(variantId, usuarioId);
  if (existente) {
    throw new AppError('Ya has valorado esta variante. Puedes editar tu valoración.', 409);
  }

  const creado = await commentRepository.create({ variant: variantId, user: usuarioId, rating, text });
  const avatares = await commentRepository.findAvatarsByUserIds([usuarioId]);
  return formatear(creado, avatares);
};

// Solo el autor puede editar su comentario (ni siquiera el admin)
const actualizar = async (id, usuarioId, cambios) => {
  const comentario = await asegurarComentario(id);
  if (String(comentario.user) !== String(usuarioId)) {
    throw new AppError('Solo puedes editar tus propios comentarios', 403);
  }

  const cambiosPermitidos = {};
  if (cambios.rating !== undefined) cambiosPermitidos.rating = cambios.rating;
  if (cambios.text !== undefined) cambiosPermitidos.text = cambios.text;

  const actualizado = await commentRepository.updateById(id, cambiosPermitidos);
  const avatares = await commentRepository.findAvatarsByUserIds([usuarioId]);
  return formatear(actualizado, avatares);
};

// El autor puede borrar su comentario; el admin puede borrar cualquiera
const borrar = async (id, solicitante) => {
  const comentario = await asegurarComentario(id);
  const esAutor = String(comentario.user) === String(solicitante.id);
  const esAdmin = solicitante.role === ADMIN_ROLE;

  if (!esAutor && !esAdmin) {
    throw new AppError('Solo puedes borrar tus propios comentarios', 403);
  }

  await commentRepository.deleteById(id);
  return { _id: id };
};

// Sentimiento por concierto: cuántas valoraciones son positivas, neutras o negativas (solo admin)
const sentimientoPorConcierto = async () => {
  const filas = await commentRepository.sentimientoPorConcierto();
  return filas.map((fila) => ({
    concertId: String(fila._id),
    titulo: fila.titulo ?? 'Concierto eliminado',
    total: fila.total,
    media: Math.round(fila.media * 10) / 10,
    positivos: fila.positivos,
    neutros: fila.neutros,
    negativos: fila.negativos
  }));
};

module.exports = { listarPorVariante, resumenPorConcierto, textosPorConcierto, listarParaAdmin, sentimientoPorConcierto, crear, actualizar, borrar };
