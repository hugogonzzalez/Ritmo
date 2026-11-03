const ADMIN_ROLE = 'ADMIN';
const USER_ROLE = 'USER';

// En la base de datos los roles son admin y customer; en el token y en RBAC son ADMIN y USER
const resolveUserRole = (user) => {
  const roleName = user?.role?.name ?? user?.roleId?.name;
  return roleName === 'admin' ? ADMIN_ROLE : USER_ROLE;
};

module.exports = { ADMIN_ROLE, USER_ROLE, resolveUserRole };
