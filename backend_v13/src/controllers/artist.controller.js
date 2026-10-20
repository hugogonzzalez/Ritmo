const artistService = require('../services/artist.service');

class ArtistController {
  async create(req, res, next) {
    try {
      const artist = await artistService.createArtist(req.body);
      return res.status(201).json({
        success: true,
        message: 'Artist created successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const artists = await artistService.getAllArtists(includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Artists fetched successfully',
        data: artists
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const artist = await artistService.getArtistById(req.params.id, includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Artist fetched successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const artist = await artistService.getArtistBySlug(req.params.slug, includeInactive);
      return res.status(200).json({
        success: true,
        message: 'Artist fetched successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const artist = await artistService.updateArtist(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Artist updated successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const artist = await artistService.setActiveArtist(req.params.id, true);
      return res.status(200).json({
        success: true,
        message: 'Artist activated successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const artist = await artistService.setActiveArtist(req.params.id, false);
      return res.status(200).json({
        success: true,
        message: 'Artist deactivated successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const artist = await artistService.deleteArtist(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Artist deleted successfully',
        data: artist
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ArtistController();
