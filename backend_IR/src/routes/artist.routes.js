const express = require('express');
const { body, param } = require('express-validator');
const artistController = require('../controllers/artist.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const createValidations = [
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('name must have between 1 and 120 characters'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('bio must have at most 1000 characters'),
  body('socials').optional().isArray({ max: 10 }).withMessage('socials must be an array with at most 10 items'),
  body('socials.*.platform').isIn(['instagram', 'spotify', 'youtube', 'x', 'web']).withMessage('platform is invalid'),
  body('socials.*.url')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('each social url must be a valid http or https URL'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('name').optional().trim().isLength({ min: 1, max: 120 }).withMessage('name must have between 1 and 120 characters'),
  body('bio').optional().isString().isLength({ max: 1000 }).withMessage('bio must have at most 1000 characters'),
  body('socials').optional().isArray({ max: 10 }).withMessage('socials must be an array with at most 10 items'),
  body('socials.*.platform').optional().isIn(['instagram', 'spotify', 'youtube', 'x', 'web']).withMessage('platform is invalid'),
  body('socials.*.url')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('each social url must be a valid http or https URL'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/artists:
 *   post:
 *     summary: Crear un artista
 *     tags: [Artists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               socials:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Artista creado
 */
router.post('/', createValidations, validateRequest, artistController.create);

/**
 * @swagger
 * /api/artists:
 *   get:
 *     summary: Obtener artistas activos
 *     tags: [Artists]
 *     responses:
 *       200:
 *         description: Lista de artistas
 */
router.get('/', artistController.getAll);

/**
 * @swagger
 * /api/artists/slug/{slug}:
 *   get:
 *     summary: Obtener artista por slug
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artista encontrado
 */
router.get('/slug/:slug', slugValidation, validateRequest, artistController.getBySlug);

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     summary: Obtener artista por ID
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artista encontrado
 */
router.get('/:id', idValidation, validateRequest, artistController.getById);

/**
 * @swagger
 * /api/artists/{id}:
 *   patch:
 *     summary: Actualizar artista
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artista actualizado
 */
router.patch('/:id', [...idValidation, ...updateValidations], validateRequest, artistController.update);

/**
 * @swagger
 * /api/artists/{id}:
 *   delete:
 *     summary: Borrar artista lógicamente
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artista eliminado lógicamente
 */
/**
 * @swagger
 * /api/artists/{id}/activation:
 *   patch:
 *     summary: Activar o desactivar un registro (sin borrarlo)
 *     tags: [Artists]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de activación actualizado
 *       409:
 *         description: No puedes desactivar un artista con conciertos activos
 */
router.patch('/:id/activation', [...idValidation, body('isActive').isBoolean({ strict: true }).withMessage('isActive must be a boolean')], validateRequest, artistController.setActivation);

/**
 * @swagger
 * /api/artists/{id}:
 *   delete:
 *     summary: Borrar (desactivar) un artista
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artista eliminado
 *       404:
 *         description: No encontrado
 *       409:
 *         description: No puedes eliminar un artista con conciertos activos
 */
router.delete('/:id', idValidation, validateRequest, artistController.softDelete);

/**
 * @swagger
 * /api/artists/{id}/restore:
 *   patch:
 *     summary: Restaurar un registro borrado lógicamente
 *     tags: [Artists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro restaurado
 */
router.patch('/:id/restore', idValidation, validateRequest, artistController.restore);

module.exports = router;
