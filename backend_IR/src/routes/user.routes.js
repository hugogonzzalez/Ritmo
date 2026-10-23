const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const validateRequest = require('../middlewares/validation.middleware');

const router = express.Router();

const idValidation = [param('id').isMongoId().withMessage('id must be a valid MongoId')];

const slugValidation = [param('slug').trim().notEmpty().withMessage('slug is required')];

const activationValidation = [
  body('isActive').isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const passwordRules = (field) => [
  field.isString().withMessage('password must be a string'),
  field.isLength({ min: 8, max: 128 }).withMessage('password must have between 8 and 128 characters'),
  field.matches(/[A-Za-z]/).withMessage('password must contain at least one letter'),
  field.matches(/\d/).withMessage('password must contain at least one number')
];

const createValidations = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('name is required and must have at most 80 characters'),
  body('email').trim().isEmail().withMessage('email must be a valid email').isLength({ max: 254 }).withMessage('email must have at most 254 characters'),
  ...passwordRules(body('password')),
  body('roleId').isMongoId().withMessage('roleId is required and must be a valid MongoId'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const updateValidations = [
  body('name').optional().trim().isLength({ min: 1, max: 80 }).withMessage('name must have between 1 and 80 characters'),
  body('email').optional().trim().isEmail().withMessage('email must be a valid email').isLength({ max: 254 }).withMessage('email must have at most 254 characters'),
  body('password').optional().isString().withMessage('password must be a string'),
  body('password').optional().isLength({ min: 8, max: 128 }).withMessage('password must have between 8 and 128 characters'),
  body('password').optional().matches(/[A-Za-z]/).withMessage('password must contain at least one letter'),
  body('password').optional().matches(/\d/).withMessage('password must contain at least one number'),
  body('roleId').optional().isMongoId().withMessage('roleId must be a valid MongoId'),
  body('isActive').optional().isBoolean({ strict: true }).withMessage('isActive must be a boolean')
];

const listValidation = [
  query('includeInactive').optional().isBoolean().withMessage('includeInactive must be a boolean')
];

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un usuario (la contraseña se guarda con hash)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Usuario creado
 *       409:
 *         description: El email ya existe
 */
router.post('/', createValidations, validateRequest, userController.create);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener usuarios activos
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', listValidation, validateRequest, userController.getAll);

/**
 * @swagger
 * /api/users/slug/{slug}:
 *   get:
 *     summary: Obtener usuario por slug
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 */
router.get('/slug/:slug', slugValidation, validateRequest, userController.getBySlug);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 */
router.get('/:id', idValidation, validateRequest, userController.getById);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Actualizar usuario (si se envía password se vuelve a generar el hash)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       409:
 *         description: El email ya existe
 */
router.patch('/:id', [...idValidation, ...updateValidations], validateRequest, userController.update);

/**
 * @swagger
 * /api/users/{id}/activation:
 *   patch:
 *     summary: Activar o desactivar un usuario
 *     tags: [Users]
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
 */
router.patch('/:id/activation', [...idValidation, ...activationValidation], validateRequest, userController.setActivation);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Borrado lógico de un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/:id', idValidation, validateRequest, userController.softDelete);

/**
 * @swagger
 * /api/users/{id}/restore:
 *   patch:
 *     summary: Restaurar un usuario borrado lógicamente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario restaurado
 *       409:
 *         description: El email ya lo usa otro usuario
 */
router.patch('/:id/restore', idValidation, validateRequest, userController.restore);

module.exports = router;
