const mongoose = require('mongoose');
const concertRepository = require('../repositories/concert.repository');
const performanceRepository = require('../repositories/performance.repository');
const artistRepository = require('../repositories/artist.repository');
const categoryRepository = require('../repositories/category.repository');
const shopRepository = require('../repositories/shop.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

const ADMIN_DEFAULT_LIMIT = 10;
const ADMIN_MAX_LIMIT = 50;
const SORT_OPTIONS = ['default', 'date_asc', 'price_asc', 'price_desc', 'title_asc'];

// Convierte un precio de la URL en número >= 0, o null si no es válido
const parsePrice = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// Normaliza los filtros que llegan del panel de admin (mismas reglas que la tienda)
const normalizeAdminFilters = (raw = {}) => {
  const page = Math.max(1, parseInt(raw.page, 10) || 1);
  const limit = Math.min(ADMIN_MAX_LIMIT, Math.max(1, parseInt(raw.limit, 10) || ADMIN_DEFAULT_LIMIT));

  let minPrice = parsePrice(raw.min_price);
  let maxPrice = parsePrice(raw.max_price);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    category_slug: raw.category_slug || null,
    artist_slug: raw.artist_slug || null,
    venue_slug: raw.venue_slug || null,
    search: raw.search || null,
    min_price: minPrice,
    max_price: maxPrice,
    sort: SORT_OPTIONS.includes(raw.sort) ? raw.sort : 'default',
    page,
    limit
  };
};

class ConcertService {
  async createConcert(payload) {
    try {
      this.#validateConcert(payload);
      if (await concertRepository.findByTitle(payload.title)) throw new AppError('Ya existe un concierto con ese título', 409);
      const artistIds = await this.#validateArtistIds(payload.artistIds);
      const categoryIds = await this.#validateCategoryIds(payload.categoryIds);
      const slug = await this.#buildUniqueSlug(payload.title);
      return await concertRepository.create({
        ...payload,
        slug,
        artistIds: artistIds ?? [],
        categoryIds: categoryIds ?? []
      });
    } catch (error) {
      throw error;
    }
  }

  // async getAllConcerts() {
  //   try {
  //     return await concertRepository.findAll();
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  // Sin includeInactive se devuelve la lista de siempre (sin filtros ni paginación).
  // Con includeInactive (panel de admin) se aplican filtros, orden y paginación.
  async getAllConcerts(includeInactive = false, rawFilters = {}) {
    if (!includeInactive) {
      return concertRepository.findAll(false);
    }

    const { page, limit, ...filters } = normalizeAdminFilters(rawFilters);
    const { data, total } = await shopRepository.findPublishedConcerts({
      ...filters,
      includeHidden: true,
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

  // async getConcertById(id) {
  //   try {
  //     this.#validateObjectId(id);
  //     const concert = await concertRepository.findById(id);

  //     if (!concert) throw new AppError('Concierto no encontrado', 404);

  //     return concert;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getConcertById(id, includeInactive = false) {
  this.#validateObjectId(id);
  const concert = await concertRepository.findById(id, includeInactive);

  if (!concert) throw new AppError('Concierto no encontrado', 404);

  return concert;
  }

  async getConcertBySlug(slug) {
    try {
      const concert = await concertRepository.findBySlug(slug);

      if (!concert) throw new AppError('Concierto no encontrado', 404);

      return concert;
    } catch (error) {
      throw error;
    }
  }

  // async updateConcert(id, payload) {
  //   try {
  //     this.#validateObjectId(id);

  //     const current = await concertRepository.findById(id);
  //     if (!current) throw new AppError('Concierto no encontrado', 404);

  //     const data = { ...payload };
  //     delete data.slug;
  //     if (payload.title !== undefined || payload.city !== undefined) {
  //       data.slug = await this.#buildUniqueSlug(payload.title ?? current.title, payload.city ?? current.city, id);
  //     }

  //     const updated = await concertRepository.updateById(id, data);

  //     if (!updated) throw new AppError('Concierto no encontrado', 404);

  //     return updated;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async updateConcert(id, payload) {
    this.#validateObjectId(id);

    const current = await concertRepository.findById(id, true);
    if (!current) throw new AppError('Concierto no encontrado', 404);

    if (payload.title !== undefined && await concertRepository.findByTitle(payload.title, id)) throw new AppError('Ya existe un concierto con ese título', 409);

    const data = { ...payload };
    delete data.slug;

    if (payload.artistIds !== undefined) {
      data.artistIds = await this.#validateArtistIds(payload.artistIds);
    }

    if (payload.categoryIds !== undefined) {
      data.categoryIds = await this.#validateCategoryIds(payload.categoryIds);
    }

    if (payload.title !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.title, id);
    }

    const updated = await concertRepository.updateById(id, data);
    if (!updated) throw new AppError('Concierto no encontrado', 404);

    return updated;
  }

  async #ensureNoActivePerformances(id, action) {
    const performances = await performanceRepository.countActiveByConcert(id);
    if (performances > 0) throw new AppError(`No puedes ${action} un concierto con ${performances} sesiones activas`, 409);
  }

  async deleteConcert(id) {
    try {
      this.#validateObjectId(id);
      await this.#ensureNoActivePerformances(id, 'eliminar');

      const deleted = await concertRepository.softDeleteById(id);

      if (!deleted) throw new AppError('Concierto no encontrado o ya eliminado', 404);

      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async activateConcert(id) {
    return this.#setActive(id, true);
  }

  async deactivateConcert(id) {
    return this.#setActive(id, false);
  }

  async changeConcertStatus(id, status) {
    this.#validateObjectId(id);
    const concert = await concertRepository.updateById(id, { status });
    if (!concert) throw new AppError('Concierto no encontrado', 404);
    return concert;
  }

  async #setActive(id, isActive) {
    this.#validateObjectId(id);

    if (!isActive) await this.#ensureNoActivePerformances(id, 'desactivar');
    const concert = await concertRepository.setActiveById(id, isActive);
    if (!concert) throw new AppError('Concierto no encontrado', 404);
    return concert;
  }

  async #buildUniqueSlug(title, excludeId) {
    const baseSlug = generateSlug(title) || 'concierto';
    let candidate = baseSlug;
    let suffix = 2;
    
    while (await concertRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async #validateArtistIds(artistIds) {
    if (artistIds === undefined) return undefined;

    const uniqueIds = [...new Set(artistIds.map(String))];
    if (uniqueIds.length === 0) return [];

    const found = await artistRepository.countActiveByIds(uniqueIds);
    if (found !== uniqueIds.length) throw new AppError('Alguno de los artistas no existe', 404);

    return uniqueIds;
  }

  async #validateCategoryIds(categoryIds) {
    if (categoryIds === undefined) return undefined;

    const uniqueIds = [...new Set(categoryIds.map(String))];
    if (uniqueIds.length === 0) return [];

    const found = await categoryRepository.countActiveByIds(uniqueIds);
    if (found !== uniqueIds.length) throw new AppError('Alguna de las categorías no existe', 404);

    return uniqueIds;
  }

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('El ID del concierto no es válido', 400);
  }

  #validateConcert(payload) {
    if (!payload.title) {
      throw new AppError('title es obligatorio', 400);
    }
  }
  async restoreConcert(id) {
    this.#validateObjectId(id);

    const deleted = await concertRepository.findByIdIncludingDeleted(id);
    if (!deleted) throw new AppError('Concierto no encontrado', 404);

    const [artists, categories] = await Promise.all([
      Promise.all(deleted.artistIds.map((artistId) => artistRepository.findById(artistId))),
      Promise.all(deleted.categoryIds.map((categoryId) => categoryRepository.findById(categoryId)))
    ]);
    if (artists.some((artist) => !artist) || categories.some((category) => !category)) {
      throw new AppError('No puedes restaurar un concierto con artistas o categorías inactivos o eliminados', 409);
    }

    const restored = await concertRepository.restoreById(id);
    if (!restored) throw new AppError('Concierto no encontrado o no está eliminado', 404);

    return restored;
  }

}

module.exports = new ConcertService();
