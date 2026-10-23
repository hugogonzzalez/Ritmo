const mongoose = require('mongoose');
const venueRepository = require('../repositories/venue.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');
const { VENUE_STATUSES } = require('../models/venue.model');
const performanceRepository = require('../repositories/performance.repository');

// Aforo de referencia de un estadio grande
const MAX_VENUE_CAPACITY = 100000;

class VenueService {
  async createVenue(payload) {
    this.#validateCapacityLimit(payload.capacity);
    if (await venueRepository.findByName(payload.name)) throw new AppError('Ya existe una sala con ese nombre', 409);
    const slug = await this.#buildUniqueSlug(payload.name);
    return venueRepository.create({ ...payload, slug });
  }

  async getAllVenues(includeInactive = false) {
    return venueRepository.findAll(includeInactive);
  }

  async getVenueById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const venue = await venueRepository.findById(id, includeInactive);
    if (!venue) throw new AppError('Sala no encontrada', 404);

    return venue;
  }

  async getVenueBySlug(slug, includeInactive = false) {
    const venue = await venueRepository.findBySlug(slug, includeInactive);
    if (!venue) throw new AppError('Sala no encontrada', 404);

    return venue;
  }

  async updateVenue(id, payload) {
    this.#validateObjectId(id);

    const current = await venueRepository.findById(id, true);
    if (!current) throw new AppError('Sala no encontrada', 404);

    if (payload.name !== undefined && await venueRepository.findByName(payload.name, id)) throw new AppError('Ya existe una sala con ese nombre', 409);

    if (payload.capacity !== undefined) {
      await this.#validateNewCapacity(id, payload.capacity);
    }

    if (payload.status !== undefined && payload.status !== current.status) {
      await this.#ensureCanLeaveActive(id, payload.status);
    }

    const data = { ...payload };
    delete data.slug;
    delete data.images;

    if (payload.name !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.name, id);
    }

    const updated = await venueRepository.updateById(id, data);
    if (!updated) throw new AppError('Sala no encontrada', 404);

    return updated;
  }

  async changeVenueStatus(id, status) {
    this.#validateObjectId(id);

    if (!VENUE_STATUSES.includes(status)) {
      throw new AppError('status no es válido', 400);
    }

    const current = await venueRepository.findById(id, true);
    if (!current) throw new AppError('Sala no encontrada', 404);

    if (status !== current.status) {
      await this.#ensureCanLeaveActive(id, status);
    }

    const updated = await venueRepository.setStatusById(id, status);
    if (!updated) throw new AppError('Sala no encontrada', 404);

    return updated;
  }

  async setActiveVenue(id, isActive) {
    this.#validateObjectId(id);

    if (!isActive) await this.#ensureNoActivePerformances(id, 'desactivar');

    const venue = await venueRepository.setActiveById(id, isActive);
    if (!venue) throw new AppError('Sala no encontrada', 404);

    return venue;
  }

  async #ensureNoActivePerformances(id, action) {
    const performances = await performanceRepository.countActiveByVenue(id);
    if (performances > 0) throw new AppError(`No puedes ${action} una sala con ${performances} sesiones activas`, 409);
  }

  async deleteVenue(id) {
    this.#validateObjectId(id);

    await this.#ensureNoActivePerformances(id, 'eliminar');

    const deleted = await venueRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Sala no encontrada o ya eliminada', 404);

    return deleted;
  }

  #validateCapacityLimit(capacity) {
    if (capacity < 1 || capacity > MAX_VENUE_CAPACITY) {
      throw new AppError(`La capacidad debe estar entre 1 y ${MAX_VENUE_CAPACITY}`, 400);
    }
  }

  // La capacidad no puede bajar de las entradas ya reservadas en sus sesiones
  async #validateNewCapacity(id, capacity) {
    this.#validateCapacityLimit(capacity);

    const overBooked = await performanceRepository.countBookedAbove(id, capacity);
    if (overBooked > 0) {
      throw new AppError('Hay sesiones con más entradas reservadas que la nueva capacidad', 400);
    }
  }

  // Una sala no puede cerrarse ni ir a mantenimiento con sesiones próximas
  async #ensureCanLeaveActive(id, status) {
    if (status === 'active') return;

    const upcoming = await performanceRepository.countUpcomingByVenue(id);
    if (upcoming > 0) {
      throw new AppError('No se puede cerrar ni poner en mantenimiento una sala con sesiones próximas', 409);
    }
  }

  async #buildUniqueSlug(name, excludeId) {
    const baseSlug = generateSlug(name) || 'sala';
    let candidate = baseSlug;
    let suffix = 2;

    while (await venueRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('El ID de la sala no es válido', 400);
    }
  }
  async restoreVenue(id) {
    const restored = await venueRepository.restoreById(id);
    if (!restored) throw new AppError('Sala no encontrado o no está eliminado', 404);

    return restored;
  }

}

module.exports = new VenueService();
