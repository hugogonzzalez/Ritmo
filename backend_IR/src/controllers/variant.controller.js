const variantService = require('../services/variant.service');

class VariantController {
  async create(req, res, next) {
    try {
      const variant = await variantService.createVariant(req.body);
      return res.status(201).json({ success: true, message: 'Variant created successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const variants = await variantService.getAllVariants({
        performanceId: req.query.performanceId,
        includeInactive
      });
      return res.status(200).json({ success: true, message: 'Variants fetched successfully', data: variants });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const variant = await variantService.getVariantById(req.params.id, includeInactive);
      return res.status(200).json({ success: true, message: 'Variant fetched successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const variant = await variantService.getVariantBySlug(req.params.slug, includeInactive);
      return res.status(200).json({ success: true, message: 'Variant fetched successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }

  async getBySku(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const variant = await variantService.getVariantBySku(req.params.sku, includeInactive);
      return res.status(200).json({ success: true, message: 'Variant fetched successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const variant = await variantService.updateVariant(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Variant updated successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }

  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const variant = await variantService.setActiveVariant(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Variant activated successfully' : 'Variant deactivated successfully',
        data: variant
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const variant = await variantService.deleteVariant(req.params.id);
      return res.status(200).json({ success: true, message: 'Variant deleted successfully', data: variant });
    } catch (error) {
      return next(error);
    }
  }
  async restore(req, res, next) {
    try {
      const restored = await variantService.restoreVariant(req.params.id);
      return res.status(200).json({ success: true, message: 'Variante restored successfully', data: restored });
    } catch (error) {
      return next(error);
    }
  }

}

module.exports = new VariantController();
