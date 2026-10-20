const imageService = require('../services/image.service');

class ImageController {
  async create(req, res, next) {
    try {
      const images = await imageService.createImages(req.body);
      return res.status(201).json({
        success: true,
        message: 'Images created successfully',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const images = await imageService.getImages(req.query.concertId, req.query.performanceId, req.query.artistId, req.query.categoryId);
      return res.status(200).json({
        success: true,
        message: 'Images fetched successfully',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const image = await imageService.deleteImage(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: image
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ImageController();
