const venueService = require('../services/venue.service');

class VenueController {
  async create(req, res, next) {
    try {
      const venue = await venueService.createVenue(req.body);
      return res.status(201).json({ success: true, message: 'Venue created successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const venues = await venueService.getAllVenues(includeInactive);
      return res.status(200).json({ success: true, message: 'Venues fetched successfully', data: venues });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const venue = await venueService.getVenueById(req.params.id, includeInactive);
      return res.status(200).json({ success: true, message: 'Venue fetched successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const venue = await venueService.getVenueBySlug(req.params.slug, includeInactive);
      return res.status(200).json({ success: true, message: 'Venue fetched successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const venue = await venueService.updateVenue(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Venue updated successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const venue = await venueService.changeVenueStatus(req.params.id, req.body.status);
      return res.status(200).json({ success: true, message: 'Venue status changed successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const venue = await venueService.deleteVenue(req.params.id);
      return res.status(200).json({ success: true, message: 'Venue deleted successfully', data: venue });
    } catch (error) {
      return next(error);
    }
  }
  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const venue = await venueService.setActiveVenue(req.params.id, isActive);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Venue activated successfully' : 'Venue deactivated successfully',
        data: venue
      });
    } catch (error) {
      return next(error);
    }
  }
  async restore(req, res, next) {
    try {
      const restored = await venueService.restoreVenue(req.params.id);
      return res.status(200).json({ success: true, message: 'Sala restored successfully', data: restored });
    } catch (error) {
      return next(error);
    }
  }

}

module.exports = new VenueController();
