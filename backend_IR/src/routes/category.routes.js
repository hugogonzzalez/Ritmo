const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/category.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const createValidations = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('name must have between 1 and 80 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('name').optional().trim().isLength({ min: 1, max: 80 }).withMessage('name must have between 1 and 80 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('description must have at most 500 characters'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear una categoría
 *     tags: [Categories]
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
 *                 example: Rock
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada
 */
router.post('/', createValidations, validateRequest, categoryController.create);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener categorías activas
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
router.get('/', categoryController.getAll);

/**
 * @swagger
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Obtener categoría por slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría encontrada
 */
router.get('/slug/:slug', slugValidation, validateRequest, categoryController.getBySlug);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría encontrada
 */
router.get('/:id', idValidation, validateRequest, categoryController.getById);

/**
 * @swagger
 * /api/categories/{id}:
 *   patch:
 *     summary: Actualizar categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 */
router.patch('/:id', [...idValidation, ...updateValidations], validateRequest, categoryController.update);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Borrar categoría lógicamente
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada lógicamente
 */
/**
 * @swagger
 * /api/categories/{id}/activation:
 *   patch:
 *     summary: Activar o desactivar un registro (sin borrarlo)
 *     tags: [Categories]
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
 *         description: No puedes desactivar una categoría con conciertos activos
 */
router.patch('/:id/activation', [...idValidation, body('isActive').isBoolean({ strict: true }).withMessage('isActive must be a boolean')], validateRequest, categoryController.setActivation);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Borrar (desactivar) una categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       404:
 *         description: No encontrado
 *       409:
 *         description: No puedes eliminar una categoría con conciertos activos
 */
router.delete('/:id', idValidation, validateRequest, categoryController.softDelete);

/**
 * @swagger
 * /api/categorys/{id}/restore:
 *   patch:
 *     summary: Restaurar un registro borrado lógicamente
 *     tags: [Categorys]
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
router.patch('/:id/restore', idValidation, validateRequest, categoryController.restore);

module.exports = router;
