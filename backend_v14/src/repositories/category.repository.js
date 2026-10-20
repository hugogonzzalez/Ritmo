const Category = require('../models/category.model');

class CategoryRepository {
  async create(data) {
    return Category.create(data);
  }

  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Category.find(filter).sort({ name: 1 });
  }

  async findById(id, includeInactive = false) {
    const filter = { _id: id };

    if (!includeInactive) filter.isActive = true;
    return Category.findOne(filter);
  }

  async findBySlug(slug, includeInactive = false) {
    const filter = { slug };

    if (!includeInactive) filter.isActive = true;
    return Category.findOne(filter);
  }

  async updateById(id, payload) {
    return Category.findOneAndUpdate(
      { _id: id },
      { ...payload, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async softDeleteById(id) {
    return Category.findOneAndUpdate(
      { _id: id },
      { isActive: false, deletedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async setActiveById(id, isActive) {
    const category = await Category.findById(id).setOptions({ includeDeleted: true });

    if (!category) {
      return null;
    }

    if (category.isActive !== isActive || (isActive && category.deletedAt)) {
      category.isActive = isActive;

      if (isActive) {
        category.deletedAt = null;
      }

      category.updatedAt = new Date();
      await category.save();
    }

    return category;
  }

  async slugExists(slug, excludeId) {
    const filter = { slug };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existing = await Category.findOne(filter)
      .setOptions({ includeDeleted: true })
      .select('_id');

    return Boolean(existing);
  }

  async addImages(id, urls) {
    return Category.findOneAndUpdate({ _id: id }, { $addToSet: { images: { $each: urls } } }, { new: true });
  }

  async removeImage(id, url) {
    return Category.findOneAndUpdate({ _id: id }, { $pull: { images: url } }, { new: true });
  }

  async countActiveByIds(ids) {
    return Category.countDocuments({ _id: { $in: ids }, deletedAt: null });
  }
}

module.exports = new CategoryRepository();
