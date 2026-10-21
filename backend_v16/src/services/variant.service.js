const mongoose = require('mongoose');
const variantRepository = require('../repositories/variant.repository');
const performanceRepository = require('../repositories/performance.repository');
const venueRepository = require('../repositories/venue.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

class VariantService {
  async createVariant(payload) {
    const performance = await this.#getPerformanceOrFail(payload.performanceId);
    await this.#ensureUniqueName(payload.performanceId, payload.name);

    const sold = payload.sold ?? 0;
    this.#ensureSoldWithinQuantity(sold, payload.quantity);
    await this.#validateStock(payload.performanceId, payload.quantity);

    const { images, ...data } = payload;
    const slug = await this.#buildUniqueSlug(`${performance.slug}-${payload.name}`);

    return variantRepository.create({ ...data, sold, slug });
  }

  async getAllVariants({ performanceId, includeInactive = false } = {}) {
    if (performanceId) this.#validateObjectId(performanceId, 'performanceId no es válido');
    return variantRepository.findAll({ performanceId, includeInactive });
  }

  async getVariantById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const variant = await variantRepository.findById(id, includeInactive);
    if (!variant) throw new AppError('Variante no encontrada', 404);

    return variant;
  }

  async getVariantBySlug(slug, includeInactive = false) {
    const variant = await variantRepository.findBySlug(slug, includeInactive);
    if (!variant) throw new AppError('Variante no encontrada', 404);

    return variant;
  }

  async updateVariant(id, payload) {
    this.#validateObjectId(id);

    const current = await variantRepository.findById(id, true);
    if (!current) throw new AppError('Variante no encontrada', 404);

    const data = { ...payload };
    delete data.slug;
    delete data.images;

    const currentPerformanceId = current.performanceId.toString();
    const performanceId = data.performanceId ?? currentPerformanceId;
    const name = data.name ?? current.name;
    const quantity = data.quantity ?? current.quantity;
    const sold = data.sold ?? current.sold;

    this.#ensureSoldWithinQuantity(sold, quantity);

    const performanceChanged = performanceId !== currentPerformanceId;
    const nameChanged = name !== current.name;

    if (performanceChanged || nameChanged) {
      const performance = performanceChanged
        ? await this.#getPerformanceOrFail(performanceId)
        : await performanceRepository.findById(performanceId, true);

      await this.#ensureUniqueName(performanceId, name, id);
      data.slug = await this.#buildUniqueSlug(`${performance.slug}-${name}`, id);
    }

    if (performanceChanged || quantity !== current.quantity) {
      await this.#validateStock(performanceId, quantity, id);
    }

    const updated = await variantRepository.updateById(id, data);
    if (!updated) throw new AppError('Variante no encontrada', 404);

    return updated;
  }

  async setActiveVariant(id, isActive) {
    this.#validateObjectId(id);

    const variant = await variantRepository.setActiveById(id, isActive);
    if (!variant) throw new AppError('Variante no encontrada', 404);

    return variant;
  }

  async deleteVariant(id) {
    this.#validateObjectId(id);

    const deleted = await variantRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Variante no encontrada o ya eliminada', 404);

    return deleted;
  }

  // Las entradas de todas las variantes de una sesión no pueden superar el aforo de su sala
  async #validateStock(performanceId, quantity, excludeId) {
    const performance = await performanceRepository.findById(performanceId, true);
    if (!performance) throw new AppError('Sesión no encontrada', 404);

    const venue = await venueRepository.findById(performance.venueId, true);
    if (!venue) throw new AppError('Sala no encontrada', 404);

    const reserved = await variantRepository.sumQuantityByPerformance(performanceId, excludeId);
    const total = reserved + quantity;

    if (total > venue.capacity) {
      throw new AppError(`Las entradas de todas las variantes (${total}) superan el aforo de la sala (${venue.capacity})`, 400);
    }
  }

  async #getPerformanceOrFail(performanceId) {
    this.#validateObjectId(performanceId, 'performanceId no es válido');

    const performance = await performanceRepository.findById(performanceId);
    if (!performance) throw new AppError('Sesión no encontrada o inactiva', 404);

    return performance;
  }

  async #ensureUniqueName(performanceId, name, excludeId) {
    const existing = await variantRepository.findByNameInPerformance(performanceId, name, excludeId);

    if (existing) throw new AppError('Ya existe una variante con ese nombre en esta sesión', 409);
  }

  #ensureSoldWithinQuantity(sold, quantity) {
    if (sold > quantity) throw new AppError('sold no puede ser mayor que quantity', 400);
  }

  async #buildUniqueSlug(text, excludeId) {
    const baseSlug = generateSlug(text) || 'variante';
    let candidate = baseSlug;
    let suffix = 2;

    while (await variantRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateObjectId(id, message = 'El ID de la variante no es válido') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(message, 400);
    }
  }
  async restoreVariant(id) {
    const restored = await variantRepository.restoreById(id);
    if (!restored) throw new AppError('Variante no encontrado o no está eliminado', 404);

    return restored;
  }

}

module.exports = new VariantService();
