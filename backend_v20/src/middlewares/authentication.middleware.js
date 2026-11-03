const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const revokedTokenRepository = require('../repositories/revoked-token.repository');
const AppError = require('../utils/app-error');
const { verifyAccessToken } = require('../utils/jwt.util');
const { resolveUserRole } = require('../utils/role.util');
const { AUTH_COOKIE_NAME } = require('../utils/auth-cookie.util');

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
};

// Valida el JWT y adjunta el usuario en req.user
const authenticate = async (req, res, next) => {
  try {
    // Primero la cookie del navegador; si no existe, el encabezado Bearer (Postman, Swagger)
    const token = req.cookies?.[AUTH_COOKIE_NAME] ?? extractBearerToken(req.headers.authorization);
    if (!token) throw new AppError('Authentication required', 401);

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Authentication required', 401);
    }

    if (!mongoose.isValidObjectId(payload.sub)) throw new AppError('Authentication required', 401);

    // Token cerrado con logout
    if (payload.jti && await revokedTokenRepository.isRevoked(payload.jti)) {
      throw new AppError('Authentication required', 401);
    }

    // findById ya excluye los usuarios borrados lógicamente
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive || user.status === 'blocked') {
      throw new AppError('Authentication required', 401);
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: resolveUserRole(user),
      status: user.status,
      // Necesarios para revocar este token en logout (tokens antiguos no tienen jti)
      tokenId: payload.jti ?? null,
      tokenExp: payload.exp ?? null
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { authenticate };
