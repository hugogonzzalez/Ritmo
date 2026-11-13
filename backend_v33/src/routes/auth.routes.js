const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/authentication.middleware');

const router = express.Router();

const registerValidations = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('name is required and must have at most 80 characters'),
  body('email').trim().isEmail().withMessage('email must be valid').isLength({ max: 254 }).withMessage('email must have at most 254 characters'),
  body('password')
    .isString().withMessage('password must be a string')
    .isLength({ min: 8, max: 128 }).withMessage('password must have between 8 and 128 characters')
    .matches(/[A-Za-z]/).withMessage('password must contain at least one letter')
    .matches(/\d/).withMessage('password must contain at least one number')
];

const loginValidations = [
  body('email').trim().isEmail().withMessage('email must be valid'),
  body('password').isString().notEmpty().withMessage('password is required')
];

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un cliente (rol USER) y guardar el token en cookie
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nuevo Usuario
 *               email:
 *                 type: string
 *                 example: nuevo@ritmo.test
 *               password:
 *                 type: string
 *                 example: Ritmo2026
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       409:
 *         description: Ya existe un usuario con ese email
 */
router.post('/register', registerValidations, validateRequest, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión con email y contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: ana.garcia@ritmo.test
 *               password:
 *                 type: string
 *                 example: Ritmo2026
 *     responses:
 *       200:
 *         description: Login correcto. El token JWT se envía en la cookie httpOnly ritmo_token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidations, validateRequest, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión y revocar el token actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada, el token deja de ser válido
 *       401:
 *         description: Authentication required
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Usuario autenticado y su perfil
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario obtenido
 *       401:
 *         description: Authentication required
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
