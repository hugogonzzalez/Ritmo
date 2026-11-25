const commentService = require('../services/comment.service');

// GET /api/comments/variant/:variantId
const listarPorVariante = async (req, res, next) => {
  try {
    const data = await commentService.listarPorVariante(req.params.variantId);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// GET /api/comments/concert/:concertId/resumen
const resumenPorConcierto = async (req, res, next) => {
  try {
    const data = await commentService.resumenPorConcierto(req.params.concertId);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// GET /api/comments/concert/:concertId/textos
const textosPorConcierto = async (req, res, next) => {
  try {
    const data = await commentService.textosPorConcierto(req.params.concertId);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// GET /api/comments/admin?page=1&limit=20
const listarParaAdmin = async (req, res, next) => {
  try {
    const resultado = await commentService.listarParaAdmin(req.query);
    return res.json({ success: true, data: resultado.data, pagination: resultado.pagination });
  } catch (error) {
    return next(error);
  }
};

// POST /api/comments/variant/:variantId
const crear = async (req, res, next) => {
  try {
    const data = await commentService.crear(req.params.variantId, req.user.id, req.body);
    return res.status(201).json({ success: true, message: 'Comentario creado', data });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/comments/:id
const actualizar = async (req, res, next) => {
  try {
    const data = await commentService.actualizar(req.params.id, req.user.id, req.body);
    return res.json({ success: true, message: 'Comentario actualizado', data });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/comments/:id
const borrar = async (req, res, next) => {
  try {
    const data = await commentService.borrar(req.params.id, req.user);
    return res.json({ success: true, message: 'Comentario borrado', data });
  } catch (error) {
    return next(error);
  }
};

// GET /api/comments/admin/sentimiento
const sentimientoPorConcierto = async (req, res, next) => {
  try {
    const data = await commentService.sentimientoPorConcierto();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listarPorVariante, resumenPorConcierto, textosPorConcierto, listarParaAdmin, sentimientoPorConcierto, crear, actualizar, borrar };
