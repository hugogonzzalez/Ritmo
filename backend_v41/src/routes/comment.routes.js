const express = require('express');
const { body, param } = require('express-validator');
const commentController = require('../controllers/comment.controller');
const validateRequest = require('../middlewares/validation.middleware');
const { authenticate } = require('../middlewares/authentication.middleware');
const { authorizeRoles } = require('../middlewares/authorization.middleware');
const { ADMIN_ROLE } = require('../utils/role.util');

const router = express.Router();

const idValidation = param('id').isMongoId().withMessage('id must be a valid MongoId');
const variantIdValidation = param('variantId').isMongoId().withMessage('variantId must be a valid MongoId');
const concertIdValidation = param('concertId').isMongoId().withMessage('concertId must be a valid MongoId');

// Valoración: entero de 1 a 5. En la edición es opcional.
const ratingValidation = (opcional) => {
  const regla = body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be an integer between 1 and 5');
  return opcional ? regla.optional() : regla;
};

const textValidation = (opcional) => {
  const regla = body('text').trim().isLength({ min: 1, max: 500 }).withMessage('text must have between 1 and 500 characters');
  return opcional ? regla.optional() : regla;
};

// Lectura pública
router.get('/variant/:variantId', variantIdValidation, validateRequest, commentController.listarPorVariante);
router.get('/concert/:concertId/resumen', concertIdValidation, validateRequest, commentController.resumenPorConcierto);
// Dashboard del admin: todas las valoraciones (solo admin)
router.get('/admin', authenticate, authorizeRoles(ADMIN_ROLE), commentController.listarParaAdmin);
router.get('/admin/sentimiento', authenticate, authorizeRoles(ADMIN_ROLE), commentController.sentimientoPorConcierto);

router.get('/concert/:concertId/textos', concertIdValidation, validateRequest, commentController.textosPorConcierto);

// Escribir, editar y borrar requieren sesión
router.post(
  '/variant/:variantId',
  authenticate,
  variantIdValidation,
  ratingValidation(false),
  textValidation(false),
  validateRequest,
  commentController.crear
);

router.put(
  '/:id',
  authenticate,
  idValidation,
  ratingValidation(true),
  textValidation(true),
  validateRequest,
  commentController.actualizar
);

router.delete('/:id', authenticate, idValidation, validateRequest, commentController.borrar);

module.exports = router;
