const express = require('express');
const { body, param } = require('express-validator');
const profileController = require('../controllers/profile.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/authentication.middleware');
const { authorizeRoles, authorizeUserResource } = require('../middlewares/authorization.middleware');
const { ADMIN_ROLE } = require('../utils/role.util');

const router = express.Router();

const userIdValidation = [param('userId').isMongoId().withMessage('userId must be a valid MongoId')];

const profileValidations = [
  body('firstName').optional({ nullable: true }).isString().isLength({ max: 60 }).withMessage('firstName must have at most 60 characters'),
  body('lastName').optional({ nullable: true }).isString().isLength({ max: 60 }).withMessage('lastName must have at most 60 characters'),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 20 }).withMessage('phone must have at most 20 characters'),
  body('bio').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('bio must have at most 500 characters'),
  body('avatarUrl').optional({ nullable: true }).isURL().withMessage('avatarUrl must be a valid URL')
];

router.use(authenticate);

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Perfil del usuario autenticado
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido
 *       401:
 *         description: Authentication required
 */
/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Listar todos los perfiles (solo ADMIN)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfiles obtenidos
 *       401:
 *         description: Authentication required
 *       403:
 *         description: You do not have permission to access this resource
 */
router.get('/', authorizeRoles(ADMIN_ROLE), profileController.list);

router.get('/me', profileController.getMe);

/**
 * @swagger
 * /api/profiles/me:
 *   patch:
 *     summary: Editar mi perfil
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       401:
 *         description: Authentication required
 */
router.patch('/me', profileValidations, validateRequest, profileController.updateMe);

/**
 * @swagger
 * /api/profiles/{userId}:
 *   get:
 *     summary: Perfil de un usuario (propio o ADMIN)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido
 *       403:
 *         description: You do not have permission to access this resource
 */
router.get('/:userId', userIdValidation, validateRequest, authorizeUserResource('userId'), profileController.getByUserId);

/**
 * @swagger
 * /api/profiles/{userId}:
 *   patch:
 *     summary: Editar el perfil de un usuario (propio o ADMIN)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       403:
 *         description: You do not have permission to access this resource
 */
router.patch('/:userId', userIdValidation, profileValidations, validateRequest, authorizeUserResource('userId'), profileController.updateByUserId);

module.exports = router;
