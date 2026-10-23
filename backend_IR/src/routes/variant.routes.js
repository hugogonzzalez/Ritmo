const express = require('express');
const { body, param, query } = require('express-validator');
const variantController = require('../controllers/variant.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const skuValidation = [param('sku').trim().notEmpty().withMessage('sku is required')];

const listValidation = [
  query('performanceId').optional().isMongoId().withMessage('performanceId query must be a valid MongoId')
];

const activationValidation = [
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const createValidations = [
  body('performanceId').isMongoId().withMessage('performanceId is required and must be a valid MongoId'),
  body('name').trim().isLength({ min: 1, max: 60 }).withMessage('name is required and must have at most 60 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('price').isFloat({ min: 0 }).withMessage('price must be at least 0'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be at least 0'),
  body('sold').optional().isInt({ min: 0 }).withMessage('sold must be at least 0'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('performanceId').optional().isMongoId().withMessage('performanceId must be a valid MongoId'),
  body('name').optional().trim().isLength({ min: 1, max: 60 }).withMessage('name must have between 1 and 60 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be at least 0'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('quantity must be at least 0'),
  body('sold').optional().isInt({ min: 0 }).withMessage('sold must be at least 0'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/variants:
 *   post:
 *     summary: Crear una variante de entrada para una sesión
 *     tags: [Variants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Variant'
 *     responses:
 *       201:
 *         description: Variante creada
 */
router.post('/', createValidations, validateRequest, variantController.create);

/**
 * @swagger
 * /api/variants:
 *   get:
 *     summary: Obtener variantes activas (opcionalmente de una sesión)
 *     tags: [Variants]
 *     parameters:
 *       - in: query
 *         name: performanceId
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de variantes
 */
router.get('/', listValidation, validateRequest, variantController.getAll);

/**
 * @swagger
 * /api/variants/slug/{slug}:
 *   get:
 *     summary: Obtener variante por slug
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variante encontrada
 */
router.get('/slug/:slug', slugValidation, validateRequest, variantController.getBySlug);
router.get('/sku/:sku', skuValidation, validateRequest, variantController.getBySku);

/**
 * @swagger
 * /api/variants/{id}:
 *   get:
 *     summary: Obtener variante por ID
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variante encontrada
 */
router.get('/:id', idValidation, validateRequest, variantController.getById);

/**
 * @swagger
 * /api/variants/{id}:
 *   patch:
 *     summary: Actualizar variante
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variante actualizada
 */
router.patch('/:id', [...idValidation, ...updateValidations], validateRequest, variantController.update);

/**
 * @swagger
 * /api/variants/{id}/activation:
 *   patch:
 *     summary: Activar o desactivar una variante
 *     tags: [Variants]
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
 *         description: No puedes desactivar una variante con entradas vendidas
 */
router.patch('/:id/activation', [...idValidation, ...activationValidation], validateRequest, variantController.setActivation);

/**
 * @swagger
 * /api/variants/{id}:
 *   delete:
 *     summary: Borrado lógico de una variante
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Variante eliminada
 *       409:
 *         description: No puedes eliminar una variante con entradas vendidas
 */
router.delete('/:id', idValidation, validateRequest, variantController.softDelete);

/**
 * @swagger
 * /api/variants/{id}/restore:
 *   patch:
 *     summary: Restaurar un registro borrado lógicamente
 *     tags: [Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro restaurado
 *       409:
 *         description: No puedes restaurar una variante si su sesión está inactiva o eliminada
 */
router.patch('/:id/restore', idValidation, validateRequest, variantController.restore);

module.exports = router;
