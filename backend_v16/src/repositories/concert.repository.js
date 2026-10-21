const Concert = require('../models/concert.model');

class ConcertRepository {
  async create(data) {
    try {
      const concert = await Concert.create(data);
      return await concert.populate([
        { path: 'artists', select: 'name slug isActive images' },
        { path: 'categories', select: 'name slug isActive images' }
      ]);
    } catch (error) {
      throw error;
    }
  }

  // async findAll() {
  //   try {
  //     return await Concert.find({ isActive: true }).sort({ date: 1 });
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async findAll(includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };
  
  return Concert.find(filter).sort({ date: 1 }).populate('artists', 'name slug isActive images')
    .populate('categories', 'name slug isActive images');
}

  // async findById(id) {
  //   try {
  //     return await Concert.findOne({ _id: id, isActive: true });
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async findById(id, includeInactive = false) {
  const filter = { _id: id };

  if (!includeInactive) filter.isActive = true;
  return Concert.findOne(filter).populate('artists', 'name slug isActive images')
    .populate('categories', 'name slug isActive images');
}


  async findBySlug(slug) {
    try {
      return await Concert.findOne({ slug, isActive: true }).populate('artists', 'name slug isActive images')
    .populate('categories', 'name slug isActive images');
    } catch (error) {
      throw error;
    }
  }

  // async updateById(id, payload) {
  //   try {
  //     return await Concert.findOneAndUpdate(
  //       { _id: id, isActive: true },
  //       payload,
  //       {
  //         new: true,
  //         runValidators: true
  //       }
  //     );
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async updateById(id, payload) {
  return Concert.findOneAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true }
  ).populate('artists', 'name slug isActive images')
    .populate('categories', 'name slug isActive images');
  }

  // async softDeleteById(id) {
  //   try {
  //     return await Concert.findOneAndUpdate(
  //       { _id: id, isActive: true },
  //       {
  //         isActive: false,
  //         deletedAt: new Date()
  //       },
  //       {
  //         new: true,
  //         runValidators: true
  //       }
  //     );
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async softDeleteById(id) {
  return Concert.findOneAndUpdate(
    { _id: id },
    { isActive: false, deletedAt: new Date() },
    { new: true, runValidators: true }
  );
}

  async addImages(id, urls) {
    return Concert.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: urls } } }, { new: true });
  }

  async removeImage(id, url) {
    return Concert.findOneAndUpdate({ _id: id }, { $pull: { images: url } }, { new: true });
  }

  async setActiveById(id, isActive) {
    try {
      const concert = await Concert.findById(id)
        .setOptions({ includeDeleted: true });

      if (!concert) {
        return null;
      }

      if (concert.isActive !== isActive || (isActive && concert.deletedAt)) {
        concert.isActive = isActive;

        if (isActive) {
          concert.deletedAt = null;
        }

        await concert.save();
      }

      return await concert.populate([
        { path: 'artists', select: 'name slug isActive images' },
        { path: 'categories', select: 'name slug isActive images' }
      ]);
    } catch (error) {
      throw error;
    }
  }

  async slugExists(slug, excludeId) {
    try {
      const filter = { slug };

      if (excludeId) {
        filter._id = { $ne: excludeId };
      }

      const existing = await Concert.findOne(filter)
        .setOptions({ includeDeleted: true })
        .select('_id');

      return Boolean(existing);
    } catch (error) {
      throw error;
    }
  }

  async findByTitle(value, excludeId) {
    const filter = { title: value };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Concert.findOne(filter).select('_id');
  }
  async restoreById(id) {
    return Concert.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true });
  }

}

module.exports = new ConcertRepository();
