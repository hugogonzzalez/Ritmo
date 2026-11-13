const shopRepository = require('../repositories/shop.repository');
const Concert = require('../models/concert.model');
const AppError = require('../utils/app-error');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 50;

// Convierte un precio de la URL en número >= 0, o null si no es válido
const parsePrice = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// Opciones de ordenación válidas; 'default' mantiene el orden de siempre (más recientes primero)
const SORT_OPTIONS = ['default', 'date_asc', 'price_asc', 'price_desc', 'title_asc'];

class ShopService {
  async getActiveCategories() {
    return shopRepository.findActiveCategories();
  }

  async getActiveArtists() {
    return shopRepository.findActiveArtists();
  }

  async getActiveVenues() {
    return shopRepository.findActiveVenues();
  }

  // rawParams llega de req.query: aquí se normalizan página, límite y precios antes de consultar
  async getPublishedConcerts(rawParams = {}) {
    const page = Math.max(1, parseInt(rawParams.page, 10) || DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(rawParams.limit, 10) || DEFAULT_LIMIT));

    let minPrice = parsePrice(rawParams.min_price);
    let maxPrice = parsePrice(rawParams.max_price);
    // Si los límites llegan al revés, se intercambian para no devolver un rango vacío por error
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    const sort = SORT_OPTIONS.includes(rawParams.sort) ? rawParams.sort : 'default';

    const { data, total } = await shopRepository.findPublishedConcerts({
      category_slug: rawParams.category_slug || null,
      artist_slug: rawParams.artist_slug || null,
      venue_slug: rawParams.venue_slug || null,
      search: rawParams.search || null,
      min_price: minPrice,
      max_price: maxPrice,
      sort,
      page,
      limit
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Rango de precios de las sesiones próximas: la barra del frontend lo usa como límites
  async getPriceRange() {
    return shopRepository.findSessionPriceRange();
  }

  async getPublishedConcertBySlug(slug) {
    const concert = await shopRepository.findPublishedConcertBySlug(slug);
    if (!concert) {
      throw new AppError('Concierto no encontrado', 404);
    }
    return concert;
  }

  async getAvailablePerformances(slug) {
    const concert = await shopRepository.findPublishedConcertBySlug(slug);
    if (!concert) {
      throw new AppError('Concierto no encontrado', 404);
    }
    return shopRepository.findAvailablePerformances(concert._id);
  }

  // Variantes disponibles de una sesión pública; cada una indica las plazas que quedan
  async getAvailableVariants(performanceSlug) {
    const performance = await shopRepository.findAvailablePerformanceBySlug(performanceSlug);
    if (!performance) {
      throw new AppError('Sesión no encontrada', 404);
    }

    // La sesión solo es visible si su concierto también lo es
    const concertVisible = await Concert.exists({
      _id: performance.concertId,
      isActive: true,
      deletedAt: null,
      status: { $in: ['scheduled', 'full'] }
    });
    if (!concertVisible) {
      throw new AppError('Sesión no encontrada', 404);
    }

    const variants = await shopRepository.findActiveVariants(performance._id);
    return variants.map(variant => ({
      ...variant,
      available: Math.max(0, variant.quantity - variant.sold)
    }));
  }
}

module.exports = new ShopService();
