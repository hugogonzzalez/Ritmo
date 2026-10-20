const express = require('express');
const { body, param, query } = require('express-validator');
const imageController = require('../controllers/image.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const createValidations = [
  body('concertId').optional().isMongoId().withMessage('concertId must be a valid MongoId'),
  body('performanceId').optional().isMongoId().withMessage('performanceId must be a valid MongoId'),
  body('artistId').optional().isMongoId().withMessage('artistId must be a valid MongoId'),
  body('categoryId').optional().isMongoId().withMessage('categoryId must be a valid MongoId'),
  body('urls').isArray({ min: 1, max: 20 }).withMessage('urls must be an array with 1 to 20 items'),
  body('urls.*')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .isLength({ max: 2048 })
    .withMessage('each url must be a valid http or https URL'),
  body('alt').optional().isString().isLength({ max: 160 }).withMessage('alt must have at most 160 characters')
];

const queryValidations = [
  query('concertId').optional().isMongoId().withMessage('concertId query must be a valid MongoId'),
  query('performanceId').optional().isMongoId().withMessage('performanceId query must be a valid MongoId'),
  query('artistId').optional().isMongoId().withMessage('artistId query must be a valid MongoId'),
  query('categoryId').optional().isMongoId().withMessage('categoryId query must be a valid MongoId')
];

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

/**
 * @swagger
 * /api/images:
 *   post:
 *     summary: Añadir una o varias imágenes por URL a un concierto o a una sesión
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [urls]
 *             properties:
 *               concertId:
 *                 type: string
 *               performanceId:
 *                 type: string
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *               alt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Imágenes creadas
 */
router.post('/', createValidations, validateRequest, imageController.create);

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Obtener las imágenes activas de un concierto o de una sesión
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: concertId
 *         schema:
 *           type: string
 *       - in: query
 *         name: performanceId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de imágenes
 */
router.get('/', queryValidations, validateRequest, imageController.getAll);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Borrar lógicamente una imagen
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Imagen eliminada lógicamente
 */
router.delete('/:id', idValidation, validateRequest, imageController.softDelete);

module.exports = router;
