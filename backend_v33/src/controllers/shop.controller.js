const shopService = require('../services/shop.service');

class ShopController {
  async getCategories(req, res, next) {
    try {
      const data = await shopService.getActiveCategories();
      return res.status(200).json({ success: true, message: 'Categories fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  async getArtists(req, res, next) {
    try {
      const data = await shopService.getActiveArtists();
      return res.status(200).json({ success: true, message: 'Artists fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  async getVenues(req, res, next) {
    try {
      const data = await shopService.getActiveVenues();
      return res.status(200).json({ success: true, message: 'Venues fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  // Lee los filtros de req.query y los pasa al servicio
  async getConcerts(req, res, next) {
    try {
      const { category_slug, artist_slug, venue_slug, search, min_price, max_price, sort, page, limit } = req.query;
      const result = await shopService.getPublishedConcerts({
        category_slug,
        artist_slug,
        venue_slug,
        search,
        min_price,
        max_price,
        sort,
        page,
        limit
      });
      return res.status(200).json({ success: true, message: 'Concerts fetched successfully', ...result });
    } catch (error) {
      return next(error);
    }
  }

  async getPriceRange(req, res, next) {
    try {
      const data = await shopService.getPriceRange();
      return res.status(200).json({ success: true, message: 'Price range fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  async getConcertBySlug(req, res, next) {
    try {
      const data = await shopService.getPublishedConcertBySlug(req.params.slug);
      return res.status(200).json({ success: true, message: 'Concert fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  async getPerformancesByConcertSlug(req, res, next) {
    try {
      const data = await shopService.getAvailablePerformances(req.params.slug);
      return res.status(200).json({ success: true, message: 'Performances fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }

  async getVariantsByPerformanceSlug(req, res, next) {
    try {
      const data = await shopService.getAvailableVariants(req.params.slug);
      return res.status(200).json({ success: true, message: 'Variants fetched successfully', data });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ShopController();
