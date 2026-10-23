const concertService = require('../services/concert.service');

class ConcertController {
  async create(req, res, next) {
    try {
      const concert = await concertService.createConcert(req.body);
      return res.status(201).json({
        success: true,
        message: 'Concert created successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }

  // async getAll(req, res, next) {
  //   try {
  //     const concerts = await concertService.getAllConcerts();
  //     return res.status(200).json({
  //       success: true,
  //       message: 'Concerts fetched successfully',
  //       data: concerts
  //     });
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

   async getAll(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const concerts = await concertService.getAllConcerts(includeInactive);

      return res.status(200).json({
        success: true,
        message: 'Concerts fetched successfully',
        data: concerts
      });
    } catch (error) {
      return next(error);
    }
  }

  // async getById(req, res, next) {
  //   try {
  //     const concert = await concertService.getConcertById(req.params.id);
  //     return res.status(200).json({
  //       success: true,
  //       message: 'Concert fetched successfully',
  //       data: concert
  //     });
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  async getById(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const concert = await concertService.getConcertById(
        req.params.id,
        includeInactive
      );

      return res.status(200).json({
        success: true,
        message: 'Concert fetched successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const concert = await concertService.getConcertBySlug(req.params.slug);
      return res.status(200).json({
        success: true,
        message: 'Concert fetched successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const concert = await concertService.updateConcert(
        req.params.id,
        req.body
      );
      return res.status(200).json({
        success: true,
        message: 'Concert updated successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const concert = await concertService.changeConcertStatus(req.params.id, req.body.status);
      return res.status(200).json({
        success: true,
        message: 'Concert status changed successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const concert = await concertService.deleteConcert(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Concert deleted successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }


  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive;
      const concert = isActive
        ? await concertService.activateConcert(req.params.id)
        : await concertService.deactivateConcert(req.params.id);

      return res.status(200).json({
        success: true,
        message: isActive ? 'Concert activated successfully' : 'Concert deactivated successfully',
        data: concert
      });
    } catch (error) {
      return next(error);
    }
  }
  async restore(req, res, next) {
    try {
      const restored = await concertService.restoreConcert(req.params.id);
      return res.status(200).json({ success: true, message: 'Concierto restored successfully', data: restored });
    } catch (error) {
      return next(error);
    }
  }

}

module.exports = new ConcertController();