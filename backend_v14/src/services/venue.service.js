const mongoose = require('mongoose');
const venueRepository = require('../repositories/venue.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');
const { VENUE_STATUSES } = require('../models/venue.model');

class VenueService {
  async createVenue(payload) {
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

    const updated = await venueRepository.setStatusById(id, status);
    if (!updated) throw new AppError('Sala no encontrada', 404);

    return updated;
  }

  async setActiveVenue(id, isActive) {
    this.#validateObjectId(id);

    const venue = await venueRepository.setActiveById(id, isActive);
    if (!venue) throw new AppError('Sala no encontrada', 404);

    return venue;
  }

  async deleteVenue(id) {
    this.#validateObjectId(id);

    const deleted = await venueRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Sala no encontrada o ya eliminada', 404);

    return deleted;
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
}

module.exports = new VenueService();
