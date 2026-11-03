const { ADMIN_ROLE } = require('./role.util');

// ABAC: un ADMIN accede a cualquier recurso; el resto solo a los que tienen su userId
const isOwnerOrAdmin = (user, resource) => {
  if (!user || !resource) return false;
  if (user.role === ADMIN_ROLE) return true;

  return String(user.id) === String(resource.userId);
};

const canAccessUserResource = (user, resource) => isOwnerOrAdmin(user, resource);

module.exports = { isOwnerOrAdmin, canAccessUserResource };
