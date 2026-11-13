const express = require('express');
const { query, param } = require('express-validator');
const shopController = require('../controllers/shop.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

// Tienda pública: no requiere sesión

/**
 * @swagger
 * /api/shop/categories:
 *   get:
 *     summary: Categorías activas (tienda pública)
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: Categorías obtenidas
 */
router.get('/categories', shopController.getCategories);

/**
 * @swagger
 * /api/shop/artists:
 *   get:
 *     summary: Artistas activos (tienda pública)
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: Artistas obtenidos
 */
router.get('/artists', shopController.getArtists);

/**
 * @swagger
 * /api/shop/venues:
 *   get:
 *     summary: Salas activas y abiertas (tienda pública)
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: Salas obtenidas
 */
router.get('/venues', shopController.getVenues);

/**
 * @swagger
 * /api/shop/concerts:
 *   get:
 *     summary: Conciertos publicados, con filtros y paginación
 *     tags: [Shop]
 *     parameters:
 *       - in: query
 *         name: category_slug
 *         schema: { type: string }
 *       - in: query
 *         name: artist_slug
 *         schema: { type: string }
 *       - in: query
 *         name: venue_slug
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: min_price
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: max_price
 *         schema: { type: number, minimum: 0 }
 *       - in: query
 *         name: sort
 *         description: default, date_asc (fecha más cercana), price_asc, price_desc o title_asc (A-Z)
 *         schema: { type: string, enum: [default, date_asc, price_asc, price_desc, title_asc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Conciertos obtenidos
 *       400:
 *         description: Parámetros no válidos
 */
router.get(
  '/concerts',
  [
    query('category_slug').optional().isString().withMessage('category_slug debe ser texto'),
    query('artist_slug').optional().isString().withMessage('artist_slug debe ser texto'),
    query('venue_slug').optional().isString().withMessage('venue_slug debe ser texto'),
    query('search').optional().isString().withMessage('search debe ser texto'),
    query('min_price').optional().isFloat({ min: 0 }).withMessage('min_price debe ser un número >= 0'),
    query('max_price').optional().isFloat({ min: 0 }).withMessage('max_price debe ser un número >= 0'),
    query('sort')
      .optional()
      .isIn(['default', 'date_asc', 'price_asc', 'price_desc', 'title_asc'])
      .withMessage('sort debe ser default, date_asc, price_asc, price_desc o title_asc'),
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser >= 1'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit debe estar entre 1 y 50')
  ],
  validateRequest,
  shopController.getConcerts
);

/**
 * @swagger
 * /api/shop/price-range:
 *   get:
 *     summary: Precio mínimo y máximo de las sesiones próximas (para la barra de precio)
 *     tags: [Shop]
 *     responses:
 *       200:
 *         description: Rango obtenido (data es null si no hay sesiones próximas)
 */
router.get('/price-range', shopController.getPriceRange);

/**
 * @swagger
 * /api/shop/concerts/{slug}:
 *   get:
 *     summary: Detalle de un concierto publicado
 *     tags: [Shop]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Concierto obtenido
 *       404:
 *         description: Concierto no encontrado
 */
router.get(
  '/concerts/:slug',
  [param('slug').trim().notEmpty().withMessage('slug es obligatorio')],
  validateRequest,
  shopController.getConcertBySlug
);

/**
 * @swagger
 * /api/shop/concerts/{slug}/performances:
 *   get:
 *     summary: Sesiones próximas y disponibles de un concierto
 *     tags: [Shop]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sesiones obtenidas
 *       404:
 *         description: Concierto no encontrado
 */
router.get(
  '/concerts/:slug/performances',
  [param('slug').trim().notEmpty().withMessage('slug es obligatorio')],
  validateRequest,
  shopController.getPerformancesByConcertSlug
);

/**
 * @swagger
 * /api/shop/performances/{slug}/variants:
 *   get:
 *     summary: Variantes (tipos de entrada) disponibles de una sesión
 *     tags: [Shop]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variantes obtenidas
 *       404:
 *         description: Sesión no encontrada
 */
router.get(
  '/performances/:slug/variants',
  [param('slug').trim().notEmpty().withMessage('slug es obligatorio')],
  validateRequest,
  shopController.getVariantsByPerformanceSlug
);

module.exports = router;
