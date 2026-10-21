const performanceService = require('../services/performance.service');

class PerformanceController {
  async create(req, res, next) {
    try {
      const performance = await performanceService.createPerformance(req.body);
      return res.status(201).json({
        success: true,
        message: 'Performance created successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const performances = await performanceService.getAllPerformances(req.query.concertId, includeInactive);

      return res.status(200).json({
        success: true,
        message: 'Performances fetched successfully',
        data: performances
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const performance = await performanceService.getPerformanceById(req.params.id, includeInactive);

      return res.status(200).json({
        success: true,
        message: 'Performance fetched successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const performance = await performanceService.getPerformanceBySlug(req.params.slug, includeInactive);

      return res.status(200).json({
        success: true,
        message: 'Performance fetched successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const performance = await performanceService.updatePerformance(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Performance updated successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const performance = await performanceService.changePerformanceStatus(req.params.id, req.body.status);
      return res.status(200).json({
        success: true,
        message: 'Performance status changed successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const performance = await performanceService.deletePerformance(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Performance deleted successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }


  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const performance = await performanceService.setActivePerformance(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Performance activated successfully' : 'Performance deactivated successfully',
        data: performance
      });
    } catch (error) {
      return next(error);
    }
  }
  async restore(req, res, next) {
    try {
      const restored = await performanceService.restorePerformance(req.params.id);
      return res.status(200).json({ success: true, message: 'Sesión restored successfully', data: restored });
    } catch (error) {
      return next(error);
    }
  }

}

module.exports = new PerformanceController();
