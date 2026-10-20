const mongoose = require('mongoose');
const concertRepository = require('../repositories/concert.repository');
const artistRepository = require('../repositories/artist.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

class ConcertService {
  async createConcert(payload) {
    try {
      this.#validateConcert(payload);
      const artistIds = await this.#validateArtistIds(payload.artistIds);
      const slug = await this.#buildUniqueSlug(payload.title);
      return await concertRepository.create({ ...payload, slug, artistIds: artistIds ?? [] });
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
  async getAllConcerts(includeInactive = false) {
  return concertRepository.findAll(includeInactive);
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
  try {
    this.#validateObjectId(id);

    const current = await concertRepository.findById(id, true);
    if (!current) throw new AppError('Concierto no encontrado', 404);

    const data = { ...payload };
    delete data.slug;

    if (payload.artistIds !== undefined) {
      data.artistIds = await this.#validateArtistIds(payload.artistIds);
    }

    if (payload.title !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.title, id);
    }

    const updated = await concertRepository.updateById(id, data);

    if (!updated) throw new AppError('Concierto no encontrado', 404);

    return updated;
  } catch (error) {
    throw error;
  }
}

  async deleteConcert(id) {
    try {
      this.#validateObjectId(id);
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

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('El ID del concierto no es válido', 400);
  }

  #validateConcert(payload) {
    if (!payload.title) {
      throw new AppError('title es obligatorio', 400);
    }
  }
}

module.exports = new ConcertService();
