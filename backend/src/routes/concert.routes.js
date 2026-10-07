const express = require('express');
const { body, param } = require('express-validator');
const concertController = require('../controllers/concert.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const concertStatuses = [
  'scheduled',
  'full',
  'cancelled',
  'completed'
];

const titleValidation = body('title').trim().isLength({ min: 1, max: 120 }).withMessage('title must be between 1 and 120 characters');
const venueValidation = body('venue').trim().isLength({ min: 1, max: 120 }).withMessage('venue is required and must have at most 120 characters');
const cityValidation = body('city').trim().isLength({ min: 1, max: 80 }).withMessage('city is required and must have at most 80 characters');
const dateValidation = body('date').isISO8601().withMessage('date must be a valid date');
const priceValidation = body('price').isFloat({ min: 0 }).withMessage('price must be zero or greater');
const statusValidation = body('status').optional().trim().isIn(concertStatuses).withMessage('status must be scheduled, full, cancelled or completed');
const isActiveValidation = body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean');

const createValidations = [
  titleValidation,
  venueValidation,
  cityValidation,
  dateValidation,
  priceValidation,
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  statusValidation,
  isActiveValidation
];

const updateValidations = [
  body('title').optional().trim().isLength({ min: 1, max: 120 }).withMessage('title must be between 1 and 120 characters'),
  body('venue').optional().trim().isLength({ min: 1, max: 120 }).withMessage('venue must have at most 120 characters'),
  body('city').optional().trim().isLength({ min: 1, max: 80 }).withMessage('city must be between 1 and 80 characters'),
  body('date').optional().isISO8601().withMessage('date must be a valid date'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be zero or greater'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  statusValidation,
  isActiveValidation
];

const idValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoId')
];

const slugValidation = [
  param('slug').trim().notEmpty().withMessage('slug is required')
];

/**
 * @swagger
 * /api/concerts:
 *   post:
 *     summary: Crear un concierto
 *     tags: [Conciertos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Concert'
 *     responses:
 *       201:
 *         description: Concierto creado
 */
router.post('/', createValidations, validateRequest, concertController.create);

/**
 * @swagger
 * /api/concerts:
 *   get:
 *     summary: Obtener conciertos
 *     tags: [Conciertos]
 *     responses:
 *       200:
 *         description: Lista de conciertos
 */
router.get('/', concertController.getAll);

/**
 * @swagger
 * /api/concerts/slug/{slug}:
 *   get:
 *     summary: Buscar concierto por slug
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto encontrado
 */
router.get(
  '/slug/:slug',
  slugValidation,
  validateRequest,
  concertController.getBySlug
);

/**
 * @swagger
 * /api/concerts/{id}/activate:
 *   patch:
 *     summary: Activar o restaurar un concierto
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto activado
 */
router.patch(
  '/:id/activate',
  idValidation,
  validateRequest,
  concertController.activate
);

/**
 * @swagger
 * /api/concerts/{id}/deactivate:
 *   patch:
 *     summary: Desactivar un concierto sin borrarlo
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto desactivado
 */
router.patch(
  '/:id/deactivate',
  idValidation,
  validateRequest,
  concertController.deactivate
);

/**
 * @swagger
 * /api/concerts/{id}:
 *   get:
 *     summary: Obtener concierto por ID
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto encontrado
 */
router.get('/:id', idValidation, validateRequest, concertController.getById);

/**
 * @swagger
 * /api/concerts/{id}:
 *   put:
 *     summary: Actualizar concierto
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto actualizado
 */
router.put(
  '/:id',
  [...idValidation, ...updateValidations],
  validateRequest,
  concertController.update
);

/**
 * @swagger
 * /api/concerts/{id}:
 *   delete:
 *     summary: Borrar concierto lógicamente
 *     tags: [Conciertos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concierto eliminado lógicamente
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  concertController.softDelete
);

module.exports = router;