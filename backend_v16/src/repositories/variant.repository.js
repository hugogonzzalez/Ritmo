const Variant = require('../models/variant.model');

class VariantRepository {
  #basePopulate(query) {
    return query
      .populate('performance', 'slug city startsAt status isActive');
  }

  async create(data) {
    const variant = await Variant.create(data);
    return this.#basePopulate(Variant.findById(variant._id));
  }

  async findAll({ performanceId, includeInactive = false } = {}) {
    const filter = {};

    if (performanceId) filter.performanceId = performanceId;
    if (!includeInactive) filter.isActive = true;

    return this.#basePopulate(Variant.find(filter).sort({ name: 1 }));
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Variant.findOne(filter));
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Variant.findOne(filter));
  }

  async updateById(id, payload) {
    return this.#basePopulate(
      Variant.findOneAndUpdate({ _id: id }, payload, { new: true, runValidators: true })
    );
  }

  async softDeleteById(id) {
    return Variant.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async setActiveById(id, isActive) {
    const variant = await Variant.findById(id).setOptions({ includeDeleted: true });

    if (!variant) {
      return null;
    }

    if (variant.isActive !== isActive || (isActive && variant.deletedAt)) {
      variant.isActive = isActive;

      if (isActive) {
        variant.deletedAt = null;
      }

      await variant.save();
    }

    return this.#basePopulate(Variant.findById(id).setOptions({ includeDeleted: true }));
  }

  async addImages(id, urls) {
    return Variant.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: urls } } }, { new: true });
  }

  async removeImage(id, url) {
    return Variant.findOneAndUpdate({ _id: id }, { $pull: { images: url } }, { new: true });
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Variant.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }

  async findByNameInPerformance(performanceId, name, excludeId) {
    const filter = { performanceId, name };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Variant.findOne(filter).setOptions({ includeDeleted: true }).select('_id');
  }

  // Suma de entradas de las variantes activas de una sesión (excluyendo una variante opcional)
  async sumQuantityByPerformance(performanceId, excludeId) {
    const filter = { performanceId, isActive: true, deletedAt: null };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const variants = await Variant.find(filter).select('quantity');
    return variants.reduce((total, variant) => total + variant.quantity, 0);
  }

  async countActiveByPerformance(performanceId) {
    return Variant.countDocuments({ performanceId, isActive: true, deletedAt: null });
  }
  async restoreById(id) {
    return this.#basePopulate(Variant.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true }));
  }

}

module.exports = new VariantRepository();
