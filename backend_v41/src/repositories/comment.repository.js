const mongoose = require('mongoose');
const Comment = require('../models/comment.model');
const Profile = require('../models/profile.model');

// Del autor solo se devuelve el nombre, nunca el email ni la contraseña
const AUTOR = { path: 'user', select: 'name' };

// Escapa caracteres especiales para usarlos dentro de una búsqueda de texto
const escapeRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CommentRepository {
  // Comentarios de una variante, del más reciente al más antiguo
  async findByVariant(variantId) {
    return Comment.find({ variant: variantId }).sort({ createdAt: -1 }).populate(AUTOR).lean();
  }

  // Foto de perfil de varios usuarios de una vez: { userId -> avatarUrl }
  async findAvatarsByUserIds(userIds) {
    const perfiles = await Profile.find({ userId: { $in: userIds } }).select('userId avatarUrl').lean();
    return new Map(perfiles.map((perfil) => [String(perfil.userId), perfil.avatarUrl ?? null]));
  }

  // Sin populate: sirve para comprobar de quién es el comentario
  async findById(id) {
    return Comment.findById(id).lean();
  }

  async findByVariantAndUser(variantId, userId) {
    return Comment.findOne({ variant: variantId, user: userId }).lean();
  }

  async create(data) {
    const creado = await Comment.create(data);
    return Comment.findById(creado._id).populate(AUTOR).lean();
  }

  async updateById(id, changes) {
    return Comment.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true })
      .populate(AUTOR)
      .lean();
  }

  async deleteById(id) {
    return Comment.deleteOne({ _id: id });
  }

  // Todas las valoraciones con concierto, entrada, ciudad y autor, con filtros (solo admin)
  async findPageForAdmin(page, limit, filtros) {
    const coincidencias = [];
    if (filtros.q) {
      const rx = { $regex: escapeRegex(filtros.q), $options: 'i' };
      coincidencias.push({ $or: [{ text: rx }, { 'autorDoc.name': rx }] });
    }
    if (filtros.concertId) {
      coincidencias.push({ 'sesion.concertId': new mongoose.Types.ObjectId(filtros.concertId) });
    }
    if (filtros.rating) coincidencias.push({ rating: filtros.rating });

    const pipeline = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'autorDoc' } },
      { $unwind: { path: '$autorDoc', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'variants', localField: 'variant', foreignField: '_id', as: 'variante' } },
      { $unwind: { path: '$variante', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'performances', localField: 'variante.performanceId', foreignField: '_id', as: 'sesion' } },
      { $unwind: { path: '$sesion', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'concerts', localField: 'sesion.concertId', foreignField: '_id', as: 'concierto' } },
      { $unwind: { path: '$concierto', preserveNullAndEmptyArrays: true } }
    ];
    if (coincidencias.length > 0) pipeline.push({ $match: { $and: coincidencias } });

    pipeline.push({
      $facet: {
        data: [
          { $sort: { createdAt: filtros.orden === 'asc' ? 1 : -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { rating: 1, text: 1, createdAt: 1, autor: '$autorDoc.name', entrada: '$variante.name', ciudad: '$sesion.city', concierto: '$concierto.title' } }
        ],
        total: [{ $count: 'n' }]
      }
    });

    const [resultado] = await Comment.aggregate(pipeline);
    return { items: resultado.data, total: resultado.total[0]?.n ?? 0 };
  }

  // Textos de las valoraciones de un concierto, con su entrada y su ciudad (los usa el agente de IA)
  async findTextosByConcert(concertId) {
    return Comment.aggregate([
      { $lookup: { from: 'variants', localField: 'variant', foreignField: '_id', as: 'variante' } },
      { $unwind: '$variante' },
      { $lookup: { from: 'performances', localField: 'variante.performanceId', foreignField: '_id', as: 'sesion' } },
      { $unwind: '$sesion' },
      { $match: { 'sesion.concertId': new mongoose.Types.ObjectId(concertId) } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      { $project: { _id: 0, rating: 1, text: 1, createdAt: 1, entrada: '$variante.name', ciudad: '$sesion.city' } }
    ]);
  }

  // Media y número de valoraciones de UNA variante
  async statsByVariant(variantId) {
    const [resultado] = await Comment.aggregate([
      { $match: { variant: new mongoose.Types.ObjectId(variantId) } },
      { $group: { _id: null, media: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);

    if (!resultado) return { media: null, total: 0 };
    return { media: Math.round(resultado.media * 10) / 10, total: resultado.total };
  }

  // Media y número de valoraciones de TODAS las variantes de un concierto (sumando sus sesiones)
  async statsByConcert(concertId) {
    const [resultado] = await Comment.aggregate([
      { $lookup: { from: 'variants', localField: 'variant', foreignField: '_id', as: 'variante' } },
      { $unwind: '$variante' },
      { $lookup: { from: 'performances', localField: 'variante.performanceId', foreignField: '_id', as: 'sesion' } },
      { $unwind: '$sesion' },
      { $match: { 'sesion.concertId': new mongoose.Types.ObjectId(concertId) } },
      { $group: { _id: null, media: { $avg: '$rating' }, total: { $sum: 1 } } }
    ]);

    if (!resultado) return { media: null, total: 0 };
    return { media: Math.round(resultado.media * 10) / 10, total: resultado.total };
  }

  // Cuenta positivas (4-5), neutras (3) y negativas (1-2) de cada concierto (solo admin)
  async sentimientoPorConcierto() {
    return Comment.aggregate([
      { $lookup: { from: 'variants', localField: 'variant', foreignField: '_id', as: 'variante' } },
      { $unwind: '$variante' },
      { $lookup: { from: 'performances', localField: 'variante.performanceId', foreignField: '_id', as: 'sesion' } },
      { $unwind: '$sesion' },
      {
        $group: {
          _id: '$sesion.concertId',
          total: { $sum: 1 },
          media: { $avg: '$rating' },
          positivos: { $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] } },
          neutros: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          negativos: { $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'concerts', localField: '_id', foreignField: '_id', as: 'concierto' } },
      { $unwind: { path: '$concierto', preserveNullAndEmptyArrays: true } },
      { $project: { titulo: '$concierto.title', total: 1, media: 1, positivos: 1, neutros: 1, negativos: 1 } },
      { $sort: { total: -1 } }
    ]);
  }
}

module.exports = new CommentRepository();
