const express = require('express');
const { body, param, query } = require('express-validator');
const performanceController = require('../controllers/performance.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const performanceStatuses = ['scheduled', 'full', 'cancelled', 'completed'];

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const statusValidation = [body('status').trim().isIn(performanceStatuses).withMessage('status is invalid')];

const createValidations = [
  body('concertId').isMongoId().withMessage('concertId must be a valid MongoId'),
  body('venueId').isMongoId().withMessage('venueId must be a valid MongoId'),
  body('city').trim().isLength({ min: 1, max: 80 }).withMessage('city is required and must have at most 80 characters'),
  body('startsAt').isISO8601().withMessage('startsAt must be a valid date'),
  body('endsAt').optional({ nullable: true }).isISO8601().withMessage('endsAt must be a valid date'),
  body('price').isFloat({ min: 0 }).withMessage('price must be zero or greater'),
  body('bookedParticipants').optional().isInt({ min: 0 }).withMessage('bookedParticipants must be zero or greater'),
  body('status').optional().trim().isIn(performanceStatuses).withMessage('status is invalid'),
  body('artistIds').optional().isArray().withMessage('artistIds must be an array'),
  body('artistIds.*').isMongoId().withMessage('artistIds must contain valid MongoIds'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('concertId').optional().isMongoId().withMessage('concertId must be a valid MongoId'),
  body('venueId').optional().isMongoId().withMessage('venueId must be a valid MongoId'),
  body('city').optional().trim().isLength({ min: 1, max: 80 }).withMessage('city must be between 1 and 80 characters'),
  body('startsAt').optional().isISO8601().withMessage('startsAt must be a valid date'),
  body('endsAt').optional({ nullable: true }).isISO8601().withMessage('endsAt must be a valid date'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be zero or greater'),
  body('bookedParticipants').optional().isInt({ min: 0 }).withMessage('bookedParticipants must be zero or greater'),
  body('status').optional().trim().isIn(performanceStatuses).withMessage('status is invalid'),
  body('artistIds').optional().isArray().withMessage('artistIds must be an array'),
  body('artistIds.*').isMongoId().withMessage('artistIds must contain valid MongoIds'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const activationValidations = [];

const queryValidations = [
  query('concertId').optional().isMongoId().withMessage('concertId query must be a valid MongoId')
];

/**
 * @swagger
 * /api/performances:
 *   post:
 *     summary: Crear una sesión de un concierto
 *     tags: [Performances]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Performance'
 *     responses:
 *       201:
 *         description: Performance creada
 */
router.post('/', createValidations, validateRequest, performanceController.create);

/**
 * @swagger
 * /api/performances:
 *   get:
 *     summary: Obtener sesiones activas (filtro opcional por concertId)
 *     tags: [Performances]
 *     parameters:
 *       - in: query
 *         name: concertId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de sesiones
 */
router.get('/', queryValidations, validateRequest, performanceController.getAll);

/**
 * @swagger
 * /api/performances/slug/{slug}:
 *   get:
 *     summary: Obtener sesión por slug
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance encontrada
 */
router.get('/slug/:slug', slugValidation, validateRequest, performanceController.getBySlug);

/**
 * @swagger
 * /api/performances/{id}:
 *   get:
 *     summary: Obtener sesión por ID
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance encontrada
 */
router.get('/:id', idValidation, validateRequest, performanceController.getById);

/**
 * @swagger
 * /api/performances/{id}:
 *   put:
 *     summary: Actualizar sesión
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance actualizada
 */
router.put('/:id', [...idValidation, ...updateValidations], validateRequest, performanceController.update);

/**
 * @swagger
 * /api/performances/{id}/status:
 *   patch:
 *     summary: Cambiar el status de una sesión
 *     tags: [Performances]
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
 *                 enum: [scheduled, full, cancelled, completed]
 *     responses:
 *       200:
 *         description: Status cambiado
 */
router.patch('/:id/status', [...idValidation, ...statusValidation], validateRequest, performanceController.changeStatus);

/**
 * @swagger
 * /api/performances/{id}/activate:
 *   patch:
 *     summary: Activar o restaurar una sesión
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance activada
 */
router.patch(
  '/:id/activate',
  [...idValidation, ...activationValidations],
  validateRequest,
  performanceController.activate
);

/**
 * @swagger
 * /api/performances/{id}/deactivate:
 *   patch:
 *     summary: Desactivar una sesión sin borrarla
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance desactivada
 */
router.patch(
  '/:id/deactivate',
  [...idValidation, ...activationValidations],
  validateRequest,
  performanceController.deactivate
);

/**
 * @swagger
 * /api/performances/{id}:
 *   delete:
 *     summary: Borrar sesión lógicamente
 *     tags: [Performances]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance eliminada lógicamente
 */
router.delete('/:id', idValidation, validateRequest, performanceController.softDelete);

module.exports = router;
