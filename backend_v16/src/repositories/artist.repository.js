const Artist = require('../models/artist.model');

class ArtistRepository {
  async create(data) {
    return Artist.create(data);
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Artist.find(filter).sort({ name: 1 });
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return Artist.findOne(filter);
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return Artist.findOne(filter);
  }

  async updateById(id, payload) {
    return Artist.findOneAndUpdate(
      { _id: id },
      payload,
      { new: true, runValidators: true }
    );
  }

  async softDeleteById(id) {
    return Artist.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async setActiveById(id, isActive) {
    const artist = await Artist.findById(id).setOptions({ includeDeleted: true });

    if (!artist) {
      return null;
    }

    if (artist.isActive !== isActive || (isActive && artist.deletedAt)) {
      artist.isActive = isActive;

      if (isActive) {
        artist.deletedAt = null;
      }

      await artist.save();
    }

    return artist;
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Artist.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }

  async countActiveByIds(ids) {
    return Artist.countDocuments({ _id: { $in: ids }, deletedAt: null });
  }

  async addImages(id, urls) {
    return Artist.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: urls } } }, { new: true });
  }

  async removeImage(id, url) {
    return Artist.findOneAndUpdate({ _id: id }, { $pull: { images: url } }, { new: true });
  }

  async findByName(value, excludeId) {
    const filter = { name: value };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Artist.findOne(filter).select('_id');
  }
  async restoreById(id) {
    return Artist.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true });
  }

}

module.exports = new ArtistRepository();
