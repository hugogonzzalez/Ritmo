const categoryService = require('../services/category.service');

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.getAllCategories(includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Categories fetched successfully',
        data: categories
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const category = await categoryService.getCategoryById(req.params.id, includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Category fetched successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const category = await categoryService.getCategoryBySlug(req.params.slug, includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Category fetched successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const category = await categoryService.deleteCategory(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }
  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const category = await categoryService.setActiveCategory(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Category activated successfully' : 'Category deactivated successfully',
        data: category
      });
    } catch (error) {
      return next(error);
    }
  }
  async restore(req, res, next) {
    try {
      const restored = await categoryService.restoreCategory(req.params.id);
      return res.status(200).json({ success: true, message: 'Categoría restored successfully', data: restored });
    } catch (error) {
      return next(error);
    }
  }

}

module.exports = new CategoryController();
