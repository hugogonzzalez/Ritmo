const express = require('express');
const { body, param } = require('express-validator');
const venueController = require('../controllers/venue.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { VENUE_STATUSES } = require('../models/venue.model');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const statusValidation = [body('status').trim().isIn(VENUE_STATUSES).withMessage('status is invalid')];

const createValidations = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('name must have between 1 and 120 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('address').trim().isLength({ min: 1, max: 200 }).withMessage('address is required and must have at most 200 characters'),
  body('city').trim().isLength({ min: 1, max: 80 }).withMessage('city is required and must have at most 80 characters'),
  body('capacity').isInt({ min: 1 }).withMessage('capacity must be at least 1'),
  body('website').optional({ values: 'falsy' }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('website must be a valid http or https URL'),
  body('status').optional().trim().isIn(VENUE_STATUSES).withMessage('status is invalid'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('name').optional().trim().isLength({ min: 1, max: 120 }).withMessage('name must have between 1 and 120 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('address').optional().trim().isLength({ min: 1, max: 200 }).withMessage('address must have between 1 and 200 characters'),
  body('city').optional().trim().isLength({ min: 1, max: 80 }).withMessage('city must have between 1 and 80 characters'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('capacity must be at least 1'),
  body('website').optional({ values: 'falsy' }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('website must be a valid http or https URL'),
  body('status').optional().trim().isIn(VENUE_STATUSES).withMessage('status is invalid'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/venues:
 *   post:
 *     summary: Crear una sala
 *     tags: [Venues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venue'
 *     responses:
 *       201:
 *         description: Sala creada
 */
router.post('/', createValidations, validateRequest, venueController.create);

/**
 * @swagger
 * /api/venues:
 *   get:
 *     summary: Obtener salas activas
 *     tags: [Venues]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de salas
 */
router.get('/', venueController.getAll);

/**
 * @swagger
 * /api/venues/slug/{slug}:
 *   get:
 *     summary: Obtener sala por slug
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala encontrada
 */
router.get('/slug/:slug', slugValidation, validateRequest, venueController.getBySlug);

/**
 * @swagger
 * /api/venues/{id}:
 *   get:
 *     summary: Obtener sala por ID
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala encontrada
 */
router.get('/:id', idValidation, validateRequest, venueController.getById);

/**
 * @swagger
 * /api/venues/{id}:
 *   put:
 *     summary: Actualizar sala
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala actualizada
 */
router.put('/:id', [...idValidation, ...updateValidations], validateRequest, venueController.update);

/**
 * @swagger
 * /api/venues/{id}/status:
 *   patch:
 *     summary: Cambiar el estado de una sala (active, maintenance, closed)
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, maintenance, closed]
 *     responses:
 *       200:
 *         description: Estado cambiado
 */
router.patch('/:id/status', [...idValidation, ...statusValidation], validateRequest, venueController.changeStatus);

/**
 * @swagger
 * /api/venues/{id}/activate:
 *   patch:
 *     summary: Activar o restaurar una sala
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala activada
 */
router.patch('/:id/activate', idValidation, validateRequest, venueController.activate);

/**
 * @swagger
 * /api/venues/{id}/deactivate:
 *   patch:
 *     summary: Desactivar una sala sin borrarla
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala desactivada
 */
router.patch('/:id/deactivate', idValidation, validateRequest, venueController.deactivate);

/**
 * @swagger
 * /api/venues/{id}:
 *   delete:
 *     summary: Borrar sala lógicamente
 *     tags: [Venues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sala eliminada lógicamente
 */
router.delete('/:id', idValidation, validateRequest, venueController.softDelete);

module.exports = router;
