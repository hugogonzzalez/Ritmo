const mongoose = require('mongoose');
const performanceRepository = require('../repositories/performance.repository');
const variantRepository = require('../repositories/variant.repository');
const concertRepository = require('../repositories/concert.repository');
const artistRepository = require('../repositories/artist.repository');
const venueRepository = require('../repositories/venue.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

const performanceStatuses = ['scheduled', 'full', 'cancelled', 'completed'];

class PerformanceService {
  async createPerformance(payload) {
    this.#validateRequired(payload);
    const concert = await this.#getConcertOrFail(payload.concertId);
    const venue = await this.#getVenueOrFail(payload.venueId, true);
    this.#validateDates(payload.startsAt, payload.endsAt);
    this.#validateCapacity(payload.bookedParticipants || 0, venue.capacity);
    const artistIds = await this.#validateArtistIds(payload.artistIds);

    const slug = await this.#buildUniqueSlug(concert.title, payload.city, payload.startsAt);

    const data = { ...payload, slug, artistIds: artistIds ?? [] };
    delete data.capacity;
    return performanceRepository.create(data);
  }

  async getAllPerformances(concertId, includeInactive = false) {
    return performanceRepository.findAll(concertId, includeInactive);
  }

  async getPerformanceById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const performance = await performanceRepository.findById(id, includeInactive);
    if (!performance) throw new AppError('Sesión no encontrada', 404);

    return performance;
  }

  async getPerformanceBySlug(slug, includeInactive = false) {
    const performance = await performanceRepository.findBySlug(slug, includeInactive);
    if (!performance) throw new AppError('Sesión no encontrada', 404);

    return performance;
  }

  async updatePerformance(id, payload) {
    this.#validateObjectId(id);

    const current = await performanceRepository.findById(id, true);
    if (!current) throw new AppError('Sesión no encontrada', 404);

    if (payload.concertId) {
      await this.#getConcertOrFail(payload.concertId);
    }

    // Si cambia la sala, se valida contra la nueva; si no, contra la actual
    const venue = await this.#getVenueOrFail(payload.venueId ?? current.venueId, payload.venueId !== undefined);

    const startsAt = payload.startsAt ?? current.startsAt;
    const endsAt = Object.prototype.hasOwnProperty.call(payload, 'endsAt') ? payload.endsAt : current.endsAt;
    const bookedParticipants = payload.bookedParticipants ?? current.bookedParticipants;

    this.#validateDates(startsAt, endsAt);
    this.#validateCapacity(bookedParticipants, venue.capacity);

    const data = { ...payload };
    delete data.slug;
    delete data.capacity;

    if (payload.artistIds !== undefined) {
      data.artistIds = await this.#validateArtistIds(payload.artistIds);
    }

    if (payload.concertId || payload.startsAt || payload.city) {
      const concert = await this.#getConcertOrFail(payload.concertId || current.concertId);
      data.slug = await this.#buildUniqueSlug(concert.title, payload.city || current.city, startsAt, id);
    }

    const updated = await performanceRepository.updateById(id, data);
    if (!updated) throw new AppError('Sesión no encontrada', 404);

    return updated;
  }

  async changePerformanceStatus(id, status) {
    this.#validateObjectId(id);

    if (!performanceStatuses.includes(status)) {
      throw new AppError('status no es válido', 400);
    }

    const updated = await performanceRepository.updateById(id, { status });
    if (!updated) throw new AppError('Sesión no encontrada', 404);

    return updated;
  }

  async setActivePerformance(id, isActive) {
    this.#validateObjectId(id);

    if (!isActive) await this.#ensureNoActiveVariants(id, 'desactivar');

    const performance = await performanceRepository.setActiveById(id, isActive);
    if (!performance) throw new AppError('Sesión no encontrada', 404);

    return performance;
  }

  async deletePerformance(id) {
    this.#validateObjectId(id);

    await this.#ensureNoActiveVariants(id, 'eliminar');

    const deleted = await performanceRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Sesión no encontrada o ya eliminada', 404);

    return deleted;
  }

  async #ensureNoActiveVariants(id, action) {
    const variants = await variantRepository.countActiveByPerformance(id);
    if (variants > 0) throw new AppError(`No puedes ${action} una sesión con ${variants} variantes activas`, 409);
  }

  async #getConcertOrFail(concertId) {
    this.#validateObjectId(concertId, 'concertId no es válido');

    const concert = await concertRepository.findById(concertId);
    if (!concert) throw new AppError('Concierto no encontrado', 404);

    return concert;
  }

  async #getVenueOrFail(venueId, mustBeActive = false) {
    this.#validateObjectId(venueId, 'venueId no es válido');

    const venue = await venueRepository.findById(venueId, true);
    if (!venue) throw new AppError('Sala no encontrada', 404);
    if (mustBeActive && !venue.isActive) throw new AppError('La sala está inactiva', 400);

    return venue;
  }

  async #validateArtistIds(artistIds) {
    if (artistIds === undefined) return undefined;

    const uniqueIds = [...new Set(artistIds.map(String))];
    if (uniqueIds.length === 0) return [];

    const found = await artistRepository.countActiveByIds(uniqueIds);
    if (found !== uniqueIds.length) throw new AppError('Alguno de los artistas no existe', 404);

    return uniqueIds;
  }

  async #buildUniqueSlug(title, city, startsAt, excludeId) {
    const day = new Date(startsAt).toISOString().slice(0, 10);
    const baseSlug = generateSlug(`${title}-${city}-${day}`) || 'sesion';
    let candidate = baseSlug;
    let suffix = 2;

    while (await performanceRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateRequired(payload) {
    if (
      !payload.concertId ||
      !payload.venueId ||
      !payload.city ||
      !payload.startsAt ||
      payload.price === undefined
    ) {
      throw new AppError('concertId, venueId, city, startsAt y price son obligatorios', 400);
    }
  }

  #validateDates(startsAt, endsAt) {
    const start = new Date(startsAt).getTime();
    if (Number.isNaN(start)) throw new AppError('startsAt no es una fecha válida', 400);

    if (endsAt === null || typeof endsAt === 'undefined') return;

    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) throw new AppError('endsAt no es una fecha válida', 400);
    if (start >= end) throw new AppError('startsAt debe ser anterior a endsAt', 400);
  }

  #validateCapacity(bookedParticipants, capacity) {
    if (bookedParticipants < 0) throw new AppError('bookedParticipants no puede ser negativo', 400);
    if (bookedParticipants > capacity) {
      throw new AppError('bookedParticipants no puede ser mayor que capacity', 400);
    }
  }

  #validateObjectId(id, message = 'El ID de la sesión no es válido') {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(message, 400);
  }
  async restorePerformance(id) {
    this.#validateObjectId(id);

    const deleted = await performanceRepository.findByIdIncludingDeleted(id);
    if (!deleted) throw new AppError('Sesión no encontrada', 404);

    const concert = await concertRepository.findById(deleted.concertId);
    if (!concert) throw new AppError('El concierto de esta sesión está inactivo o eliminado; restáuralo primero', 409);

    const venue = await venueRepository.findById(deleted.venueId);
    if (!venue) throw new AppError('La sala de esta sesión está inactiva o eliminada; restáurala primero', 409);

    const restored = await performanceRepository.restoreById(id);
    if (!restored) throw new AppError('Sesión no encontrada o no está eliminada', 404);

    return restored;
  }

}

module.exports = new PerformanceService();
