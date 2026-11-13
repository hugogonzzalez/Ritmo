const Category = require('../models/category.model');

const { parseListParams, buildSearchFilter, buildActiveFilter, runPaginatedQuery, parseOptionalPrice, parseDateParam } = require('../utils/admin-list.util');

// Criterios de orden permitidos para este listado
const CATEGORY_SORT = { name_asc: { name: 1 }, name_desc: { name: -1 }, newest: { createdAt: -1 } };

class CategoryRepository {
  async create(data) {
    return Category.create(data);
  }

  // Listado del panel de admin: búsqueda, activos, orden y paginación
  async findPage(query) {
    const { page, limit, search, active, sort } = parseListParams(query, CATEGORY_SORT, 'name_asc');
    const filter = {
      ...buildActiveFilter(active),
      ...buildSearchFilter(search, ['name', 'slug']),
    };
    return runPaginatedQuery({ model: Category, filter, sort, page, limit });
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
      payload,
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

  async findByName(value, excludeId) {
    const filter = { name: value };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    return Category.findOne(filter).select('_id');
  }
  async restoreById(id) {
    return Category.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { isActive: true, deletedAt: null },
      { new: true, runValidators: true }
    ).setOptions({ includeDeleted: true });
  }

}

module.exports = new CategoryRepository();
