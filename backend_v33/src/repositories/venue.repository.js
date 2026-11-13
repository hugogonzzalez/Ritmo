const Venue = require('../models/venue.model');

const { parseListParams, buildSearchFilter, buildActiveFilter, runPaginatedQuery, parseOptionalPrice, parseDateParam } = require('../utils/admin-list.util');

// Criterios de orden permitidos para este listado
const VENUE_SORT = { name_asc: { name: 1 }, city_asc: { city: 1, name: 1 }, capacity_desc: { capacity: -1 } };

class VenueRepository {
  #basePopulate(query) {
    return query.populate('images', 'url alt');
  }

  async create(data) {
    const venue = await Venue.create(data);
    return venue.populate('images', 'url alt');
  }

  // Listado del panel de admin: búsqueda, activos, orden y paginación
  async findPage(query) {
    const { page, limit, search, active, sort } = parseListParams(query, VENUE_SORT, 'name_asc');
    const filter = {
      ...buildActiveFilter(active),
      ...buildSearchFilter(search, ['name', 'city']),
      ...(['active', 'maintenance', 'closed'].includes(query.status) ? { status: query.status } : {}),
    };
    return runPaginatedQuery({ model: Venue, filter, sort, page, limit, populate: (q) => this.#basePopulate(q) });
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
        payload,
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

      await venue.save();
    }

    return this.#basePopulate(Venue.findById(id).setOptions({ includeDeleted: true }));
  }

  async setStatusById(id, status) {
    return this.#basePopulate(
      Venue.findOneAndUpdate({ _id: id }, { status }, { new: true, runValidators: true })
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


  async findByName(value, excludeId) {
    const filter = { name: value };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Venue.findOne(filter).select('_id');
  }
  async restoreById(id) {
    return this.#basePopulate(Venue.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true }));
  }

}

module.exports = new VenueRepository();
