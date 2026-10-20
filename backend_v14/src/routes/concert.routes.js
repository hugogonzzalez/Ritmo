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
const statusValidation = body('status').optional().trim().isIn(concertStatuses).withMessage('status must be scheduled, full, cancelled or completed');
const isActiveValidation = body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean');

const createValidations = [
  titleValidation,
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  statusValidation,
  body('artistIds').optional().isArray().withMessage('artistIds must be an array'),
  body('artistIds.*').isMongoId().withMessage('artistIds must contain valid MongoIds'),
  body('categoryIds').optional().isArray().withMessage('categoryIds must be an array'),
  body('categoryIds.*').isMongoId().withMessage('categoryIds must contain valid MongoIds'),
  isActiveValidation
];

const updateValidations = [
  body('title').optional().trim().isLength({ min: 1, max: 120 }).withMessage('title must be between 1 and 120 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  statusValidation,
  body('artistIds').optional().isArray().withMessage('artistIds must be an array'),
  body('artistIds.*').isMongoId().withMessage('artistIds must contain valid MongoIds'),
  body('categoryIds').optional().isArray().withMessage('categoryIds must be an array'),
  body('categoryIds.*').isMongoId().withMessage('categoryIds must contain valid MongoIds'),
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

/**
 * @swagger
 * /api/concerts/{id}/status:
 *   patch:
 *     summary: Cambiar el status de un concierto
 *     tags: [Conciertos]
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
router.patch(
  '/:id/status',
  [
    ...idValidation,
    body('status').trim().isIn(concertStatuses).withMessage('status must be scheduled, full, cancelled or completed')
  ],
  validateRequest,
  concertController.changeStatus
);

module.exports = router;