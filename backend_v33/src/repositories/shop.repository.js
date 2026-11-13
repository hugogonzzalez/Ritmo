const Concert = require('../models/concert.model');
const Performance = require('../models/performance.model');
const Artist = require('../models/artist.model');
const Venue = require('../models/venue.model');
const Category = require('../models/category.model');
const Variant = require('../models/variant.model');

// Estados de concierto que se muestran en la tienda pública
const VISIBLE_CONCERT_STATUSES = ['scheduled', 'full'];

// Escapa caracteres especiales para usarlos dentro de una expresión regular
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Compara dos valores en la dirección indicada (1 = ascendente, -1 = descendente).
// Los valores que faltan (null) siempre se van al final.
const compareWithMissingLast = (a, b, direction) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1 * direction;
  if (a > b) return 1 * direction;
  return 0;
};

/**
 * Repositorio público de la tienda. Solo devuelve datos activos y no borrados.
 * Índices usados: isActive, deletedAt, status, categoryIds, artistIds, concertId, venueId, startsAt.
 */
class ShopRepository {
  // ── Catálogo ───────────────────────────────────────────────────────────────

  async findActiveCategories() {
    return Category.find({ isActive: true, deletedAt: null })
      .select('_id name slug description images')
      .sort({ name: 1 })
      .lean();
  }

  async findActiveArtists() {
    return Artist.find({ isActive: true, deletedAt: null })
      .select('_id name slug bio images')
      .sort({ name: 1 })
      .lean();
  }

  async findActiveVenues() {
    return Venue.find({ isActive: true, deletedAt: null, status: 'active' })
      .select('_id name slug city address capacity images')
      .populate('images', 'url alt')
      .sort({ city: 1, name: 1 })
      .lean();
  }

  // ── Listado de conciertos (paginado y filtrado) ────────────────────────────

  /**
   * Construye el filtro de Mongo solo con las condiciones que llegan.
   * Devuelve null si un slug no existe: en ese caso no hay resultados.
   */
  async #buildConcertFilter({ category_slug, artist_slug, venue_slug, search, min_price = null, max_price = null, includeHidden = false }) {
    // includeHidden lo usa el panel de admin: también muestra conciertos inactivos o cancelados
    // (el borrado lógico ya se excluye en el modelo)
    const filter = includeHidden
      ? {}
      : { isActive: true, status: { $in: VISIBLE_CONCERT_STATUSES } };

    if (category_slug) {
      const category = await Category.findOne({ slug: category_slug, isActive: true, deletedAt: null }).select('_id').lean();
      if (!category) return null;
      filter.categoryIds = category._id;
    }

    if (artist_slug) {
      const artist = await Artist.findOne({ slug: artist_slug, isActive: true, deletedAt: null }).select('_id').lean();
      if (!artist) return null;
      filter.artistIds = artist._id;
    }

    if (venue_slug) {
      const venue = await Venue.findOne({ slug: venue_slug, isActive: true, deletedAt: null }).select('_id').lean();
      if (!venue) return null;

      // Un concierto aparece en una sala si tiene alguna sesión próxima en esa sala
      const concertIds = await Performance.distinct('concertId', {
        venueId: venue._id,
        isActive: true,
        deletedAt: null,
        status: 'scheduled',
        startsAt: { $gt: new Date() }
      });
      filter._id = { $in: concertIds };
    }

    // Precio: un concierto cumple si tiene alguna sesión próxima con precio dentro del rango.
    // Se usa $and para no pisar la condición de _id que pueda haber puesto el filtro de sala.
    if (min_price !== null || max_price !== null) {
      const priceCondition = {};
      if (min_price !== null) priceCondition.$gte = min_price;
      if (max_price !== null) priceCondition.$lte = max_price;

      const concertIds = await Performance.distinct('concertId', {
        isActive: true,
        deletedAt: null,
        status: 'scheduled',
        startsAt: { $gt: new Date() },
        price: priceCondition
      });
      filter.$and = [...(filter.$and ?? []), { _id: { $in: concertIds } }];
    }

    if (search && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    return filter;
  }

  // limit = null significa "sin paginar" (lo usa el admin cuando pide todo)
  async findPublishedConcerts({ category_slug, artist_slug, venue_slug, search, min_price, max_price, sort = 'default', includeHidden = false, page = 1, limit = null }) {
    const filter = await this.#buildConcertFilter({ category_slug, artist_slug, venue_slug, search, min_price, max_price, includeHidden });
    if (!filter) return { data: [], total: 0 };

    // Las ordenaciones por fecha, precio o nombre necesitan datos de las sesiones: se calculan aparte
    if (sort !== 'default') {
      return this.#findSortedConcerts(filter, sort, page, limit);
    }

    const skip = limit ? (page - 1) * limit : 0;
    let query = Concert.find(filter)
      .populate('artists', 'name slug isActive images')
      .populate('categories', 'name slug isActive')
      .sort({ createdAt: -1 });
    if (limit) query = query.skip(skip).limit(limit);

    const [data, total] = await Promise.all([
      query.lean(),
      Concert.countDocuments(filter)
    ]);

    return { data, total };
  }

  /**
   * Ordena los conciertos y devuelve solo la página pedida.
   * - date_asc: fecha de la sesión próxima más cercana
   * - price_asc / price_desc: precio más bajo de sus sesiones próximas
   * - title_asc: nombre de la A a la Z
   * Los conciertos sin sesiones próximas se colocan al final.
   */
  async #findSortedConcerts(filter, sort, page, limit) {
    const concerts = await Concert.find(filter).select('_id title createdAt').lean();
    const ids = concerts.map(concert => concert._id);

    // Por cada concierto: fecha de su sesión próxima más cercana y su precio más bajo
    const stats = await Performance.aggregate([
      {
        $match: {
          concertId: { $in: ids },
          isActive: true,
          deletedAt: null,
          status: 'scheduled',
          startsAt: { $gt: new Date() }
        }
      },
      { $group: { _id: '$concertId', nextDate: { $min: '$startsAt' }, lowestPrice: { $min: '$price' } } }
    ]);
    const statsById = new Map(stats.map(item => [String(item._id), item]));

    const rows = concerts.map(concert => {
      const stat = statsById.get(String(concert._id));
      return {
        _id: concert._id,
        title: concert.title ?? '',
        createdAt: concert.createdAt,
        nextDate: stat?.nextDate ?? null,
        lowestPrice: stat?.lowestPrice ?? null
      };
    });

    const comparers = {
      date_asc: (a, b) => compareWithMissingLast(a.nextDate, b.nextDate, 1),
      price_asc: (a, b) => compareWithMissingLast(a.lowestPrice, b.lowestPrice, 1),
      price_desc: (a, b) => compareWithMissingLast(a.lowestPrice, b.lowestPrice, -1),
      title_asc: (a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
    };
    const compare = comparers[sort];

    // Si dos conciertos empatan, se muestra primero el más reciente
    rows.sort((a, b) => compare(a, b) || b.createdAt - a.createdAt);

    const skip = limit ? (page - 1) * limit : 0;
    const pageRows = limit ? rows.slice(skip, skip + limit) : rows;
    const pageIds = pageRows.map(row => row._id);

    const found = await Concert.find({ _id: { $in: pageIds } })
      .populate('artists', 'name slug isActive images')
      .populate('categories', 'name slug isActive')
      .lean();
    const foundById = new Map(found.map(concert => [String(concert._id), concert]));

    // Se devuelven en el orden calculado arriba, no en el que devuelve Mongo
    const data = pageIds.map(id => foundById.get(String(id))).filter(Boolean);

    return { data, total: rows.length };
  }

  // Precio mínimo y máximo entre las sesiones próximas visibles; null si no hay ninguna
  async findSessionPriceRange() {
    const [range] = await Performance.aggregate([
      {
        $match: {
          isActive: true,
          deletedAt: null,
          status: 'scheduled',
          startsAt: { $gt: new Date() }
        }
      },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);
    return range ? { min: range.min, max: range.max } : null;
  }

  // ── Detalle ────────────────────────────────────────────────────────────────

  async findPublishedConcertBySlug(slug) {
    return Concert.findOne({
      slug,
      isActive: true,
      deletedAt: null,
      status: { $in: VISIBLE_CONCERT_STATUSES }
    })
      .populate('artists', 'name slug bio images')
      .populate('categories', 'name slug')
      .lean();
  }

  // ── Sesiones disponibles de un concierto ───────────────────────────────────

  async findAvailablePerformances(concertId) {
    return Performance.find({
      concertId,
      isActive: true,
      deletedAt: null,
      status: 'scheduled',
      startsAt: { $gt: new Date() }
    })
      .populate('venue', 'name slug city address capacity')
      .sort({ startsAt: 1 })
      .lean();
  }

  // ── Variantes (tipos de entrada) de una sesión ─────────────────────────────

  async findAvailablePerformanceBySlug(slug) {
    return Performance.findOne({
      slug,
      isActive: true,
      deletedAt: null,
      status: 'scheduled',
      startsAt: { $gt: new Date() }
    })
      .select('_id concertId slug startsAt')
      .lean();
  }

  async findActiveVariants(performanceId) {
    return Variant.find({ performanceId, isActive: true, deletedAt: null })
      .select('_id name slug sku description price quantity sold images')
      .sort({ price: 1 })
      .lean();
  }
}

module.exports = new ShopRepository();
