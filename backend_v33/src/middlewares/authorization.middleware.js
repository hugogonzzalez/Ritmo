const AppError = require('../utils/app-error');
const { canAccessUserResource } = require('../utils/abac.util');
const { ADMIN_ROLE } = require('../utils/role.util');
const { authenticate } = require('./authentication.middleware');

const FORBIDDEN_MESSAGE = 'You do not have permission to access this resource';

// RBAC: 401 si no está autenticado, 403 si su rol no está permitido
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!allowedRoles.includes(req.user.role)) return next(new AppError(FORBIDDEN_MESSAGE, 403));

  return next();
};

// ABAC: el recurso debe pertenecer al usuario autenticado (o el usuario ser ADMIN)
const authorizeUserResource = (paramKey = 'id') => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!canAccessUserResource(req.user, { userId: req.params[paramKey] })) {
    return next(new AppError(FORBIDDEN_MESSAGE, 403));
  }

  return next();
};

// RBAC para el catálogo: leer es público, escribir solo ADMIN
const requireAdminForWrites = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  return authenticate(req, res, (error) => {
    if (error) return next(error);
    return authorizeRoles(ADMIN_ROLE)(req, res, next);
  });
};

module.exports = { authorizeRoles, authorizeUserResource, requireAdminForWrites };
