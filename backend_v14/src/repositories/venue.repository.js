const Venue = require('../models/venue.model');

class VenueRepository {
  #basePopulate(query) {
    return query.populate('images', 'url alt');
  }

  async create(data) {
    const venue = await Venue.create(data);
    return venue.populate('images', 'url alt');
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return this.#basePopulate(Venue.find(filter).sort({ name: 1 }));
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Venue.findOne(filter));
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return this.#basePopulate(Venue.findOne(filter));
  }

  async updateById(id, payload) {
    return this.#basePopulate(
      Venue.findOneAndUpdate(
        { _id: id },
        { ...payload, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
  }

  async softDeleteById(id) {
    return Venue.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async setActiveById(id, isActive) {
    const venue = await Venue.findById(id).setOptions({ includeDeleted: true });

    if (!venue) {
      return null;
    }

    if (venue.isActive !== isActive || (isActive && venue.deletedAt)) {
      venue.isActive = isActive;

      if (isActive) {
        venue.deletedAt = null;
      }

      venue.updatedAt = new Date();
      await venue.save();
    }

    return this.#basePopulate(Venue.findById(id).setOptions({ includeDeleted: true }));
  }

  async setStatusById(id, status) {
    return this.#basePopulate(
      Venue.findOneAndUpdate({ _id: id }, { status, updatedAt: new Date() }, { new: true, runValidators: true })
    );
  }

  async addImages(id, imageIds) {
    return Venue.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: imageIds } } }, { new: true });
  }

  async removeImage(id, imageId) {
    return Venue.findOneAndUpdate({ _id: id }, { $pull: { images: imageId } }, { new: true });
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Venue.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }

}

module.exports = new VenueRepository();
