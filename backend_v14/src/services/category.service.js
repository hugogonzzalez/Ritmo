const mongoose = require('mongoose');
const categoryRepository = require('../repositories/category.repository');
const { generateSlug } = require('../utils/slug.util');
const AppError = require('../utils/app-error');

class CategoryService {
  async createCategory(payload) {
    const slug = await this.#buildUniqueSlug(payload.name);
    return categoryRepository.create({ ...payload, slug });
  }

  async getAllCategories(includeInactive = false) {
    return categoryRepository.findAll(includeInactive);
  }

  async getCategoryById(id, includeInactive = false) {
    this.#validateObjectId(id);

    const category = await categoryRepository.findById(id, includeInactive);
    if (!category) throw new AppError('Categoría no encontrada', 404);

    return category;
  }

  async getCategoryBySlug(slug, includeInactive = false) {
    const category = await categoryRepository.findBySlug(slug, includeInactive);
    if (!category) throw new AppError('Categoría no encontrada', 404);

    return category;
  }

  async updateCategory(id, payload) {
    this.#validateObjectId(id);

    const current = await categoryRepository.findById(id, true);
    if (!current) throw new AppError('Categoría no encontrada', 404);

    const data = { ...payload };
    delete data.slug;

    if (payload.name !== undefined) {
      data.slug = await this.#buildUniqueSlug(payload.name, id);
    }

    const updated = await categoryRepository.updateById(id, data);
    if (!updated) throw new AppError('Categoría no encontrada', 404);

    return updated;
  }

  async setActiveCategory(id, isActive) {
    this.#validateObjectId(id);

    const category = await categoryRepository.setActiveById(id, isActive);
    if (!category) throw new AppError('Categoría no encontrada', 404);

    return category;
  }

  async deleteCategory(id) {
    this.#validateObjectId(id);

    const deleted = await categoryRepository.softDeleteById(id);
    if (!deleted) throw new AppError('Categoría no encontrada o ya eliminada', 404);

    return deleted;
  }

  async #buildUniqueSlug(name, excludeId) {
    const baseSlug = generateSlug(name) || 'categoria';
    let candidate = baseSlug;
    let suffix = 2;

    while (await categoryRepository.slugExists(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  #validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('El ID de la categoría no es válido', 400);
    }
  }
}

module.exports = new CategoryService();
