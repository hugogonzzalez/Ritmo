const Performance = require('../models/performance.model');

class PerformanceRepository {
  #basePopulate(query) {
    return query
      .populate('concert', 'title slug status isActive')
      .populate('venue', 'name slug city address capacity status isActive')
      .populate('artists', 'name slug isActive images');
  }

  async create(data) {
    return Performance.create(data);
  }

  async findAll(concertId, includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };

    if (concertId) {
      filter.concertId = concertId;
    }

    return this.#basePopulate(Performance.find(filter).sort({ startsAt: 1 }));
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Performance.findOne(filter));
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Performance.findOne(filter));
  }

  async updateById(id, payload) {
    return this.#basePopulate(
      Performance.findOneAndUpdate(
        { _id: id },
        { ...payload, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
  }

  async softDeleteById(id) {
    return Performance.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async setActiveById(id, isActive) {
    const performance = await Performance.findById(id).setOptions({ includeDeleted: true });

    if (!performance) {
      return null;
    }

    if (performance.isActive !== isActive || (isActive && performance.deletedAt)) {
      performance.isActive = isActive;

      if (isActive) {
        performance.deletedAt = null;
      }

      performance.updatedAt = new Date();
      await performance.save();
    }

    return performance;
  }

  async addImages(id, urls) {
    return Performance.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: urls } } }, { new: true });
  }

  async removeImage(id, url) {
    return Performance.findOneAndUpdate({ _id: id }, { $pull: { images: url } }, { new: true });
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Performance.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }
}

module.exports = new PerformanceRepository();
