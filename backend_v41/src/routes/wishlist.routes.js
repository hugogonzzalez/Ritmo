const express = require('express');
const { param } = require('express-validator');
const wishlistController = require('../controllers/wishlist.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/authentication.middleware');

const router = express.Router();

const variantIdValidation = param('variantId').isMongoId().withMessage('variantId must be a valid MongoId');

// Todas las rutas exigen sesión: sin login no se puede usar la lista de deseos
router.get('/', authenticate, wishlistController.listar);
router.post('/variant/:variantId', authenticate, variantIdValidation, validateRequest, wishlistController.agregar);
router.delete('/variant/:variantId', authenticate, variantIdValidation, validateRequest, wishlistController.quitar);

module.exports = router;
