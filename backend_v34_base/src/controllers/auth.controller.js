const authService = require('../services/auth.service');
const { verifyAccessToken } = require('../utils/jwt.util');
const {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
  clearAuthCookies
} = require('../utils/auth-cookie.util');

// Guarda las dos cookies. El JSON solo lleva el usuario y el perfil: los tokens no pasan por JavaScript.
const sendSession = (res, status, message, session) => {
  res.cookie(ACCESS_COOKIE_NAME, session.accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, getRefreshCookieOptions());
  return res.status(status).json({
    success: true,
    message,
    data: { user: session.user, profile: session.profile }
  });
};

class AuthController {
  async register(req, res, next) {
    try {
      // El rol siempre es cliente: el servicio ignora cualquier rol que llegue en el body
      const result = await authService.register(req.body);
      // Sin cookies: la cuenta se crea pero la sesión no se abre hasta hacer login
      return res.status(201).json({ success: true, message: 'User registered successfully', data: result });
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const session = await authService.login(req.body);
      return sendSession(res, 200, 'Login successful', session);
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const session = await authService.refresh(req.cookies?.[REFRESH_COOKIE_NAME]);
      return sendSession(res, 200, 'Session refreshed', session);
    } catch (error) {
      clearAuthCookies(res);
      return next(error);
    }
  }

  // No exige access_token: así el logout también funciona cuando ya ha caducado
  async logout(req, res, next) {
    try {
      let tokenId = req.user?.tokenId ?? null;
      let tokenExp = req.user?.tokenExp ?? null;

      const accessToken = req.cookies?.[ACCESS_COOKIE_NAME];
      if (!tokenId && accessToken) {
        try {
          const payload = verifyAccessToken(accessToken);
          tokenId = payload.jti ?? null;
          tokenExp = payload.exp ?? null;
        } catch {
          // Token caducado o inválido: no hace falta revocarlo
        }
      }

      await authService.logout({
        tokenId,
        tokenExp,
        refreshToken: req.cookies?.[REFRESH_COOKIE_NAME]
      });

      clearAuthCookies(res);
      return res.status(200).json({ success: true, message: 'Logout successful', data: null });
    } catch (error) {
      return next(error);
    }
  }

  async me(req, res, next) {
    try {
      const result = await authService.me(req.user.id);
      return res.status(200).json({ success: true, message: 'Authenticated user fetched successfully', data: result });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
