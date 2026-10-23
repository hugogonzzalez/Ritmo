const express = require('express');
const { body, param, query } = require('express-validator');
const roleController = require('../controllers/role.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { ROLE_NAMES, PERMISSIONS } = require('../models/role.model');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const activationValidation = [
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const listValidation = [
  query('includeInactive').optional().isBoolean().withMessage('includeInactive must be a boolean')
];

const createValidations = [
  body('name').trim().isIn(ROLE_NAMES).withMessage(`name must be one of: ${ROLE_NAMES.join(', ')}`),
  body('description').optional().isString().isLength({ max: 300 }).withMessage('description must have at most 300 characters'),
  body('permissions').optional().isArray().withMessage('permissions must be an array'),
  body('permissions.*').isIn(PERMISSIONS).withMessage(`each permission must be one of: ${PERMISSIONS.join(', ')}`),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('name').optional().trim().isIn(ROLE_NAMES).withMessage(`name must be one of: ${ROLE_NAMES.join(', ')}`),
  body('description').optional().isString().isLength({ max: 300 }).withMessage('description must have at most 300 characters'),
  body('permissions').optional().isArray().withMessage('permissions must be an array'),
  body('permissions.*').optional().isIn(PERMISSIONS).withMessage(`each permission must be one of: ${PERMISSIONS.join(', ')}`),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Crear un rol
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Rol creado
 *       409:
 *         description: Ya existe un rol con ese nombre
 */
router.post('/', createValidations, validateRequest, roleController.create);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Obtener roles activos
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/', listValidation, validateRequest, roleController.getAll);

/**
 * @swagger
 * /api/roles/slug/{slug}:
 *   get:
 *     summary: Obtener rol por slug
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol encontrado
 */
router.get('/slug/:slug', slugValidation, validateRequest, roleController.getBySlug);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obtener rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol encontrado
 */
router.get('/:id', idValidation, validateRequest, roleController.getById);

/**
 * @swagger
 * /api/roles/{id}:
 *   patch:
 *     summary: Actualizar rol
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol actualizado
 */
router.patch('/:id', [...idValidation, ...updateValidations], validateRequest, roleController.update);

/**
 * @swagger
 * /api/roles/{id}/activation:
 *   patch:
 *     summary: Activar o desactivar un rol (no se puede desactivar si tiene usuarios activos)
 *     tags: [Roles]
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
 *         description: No puedes desactivar o eliminar un rol con usuarios activos
 */
router.patch('/:id/activation', [...idValidation, ...activationValidation], validateRequest, roleController.setActivation);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Borrado lógico de un rol (no se puede borrar si tiene usuarios activos)
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol eliminado
 *       409:
 *         description: No puedes desactivar o eliminar un rol con usuarios activos
 */
router.delete('/:id', idValidation, validateRequest, roleController.softDelete);

/**
 * @swagger
 * /api/roles/{id}/restore:
 *   patch:
 *     summary: Restaurar un rol borrado lógicamente
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol restaurado
 */
router.patch('/:id/restore', idValidation, validateRequest, roleController.restore);

module.exports = router;
