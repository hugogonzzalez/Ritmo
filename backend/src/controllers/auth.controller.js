const authService = require('../services/auth.service');
const { AUTH_COOKIE_NAME, getAuthCookieOptions } = require('../utils/auth-cookie.util');

// Guarda el token en una cookie httpOnly y además lo devuelve en el JSON,
// para que el frontend lo guarde en AuthStore y authInterceptor lo envíe como Bearer.
const sendSession = (res, status, message, result) => {
  res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
  return res.status(status).json({ success: true, message, data: result });
};

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendSession(res, 201, 'User registered successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return sendSession(res, 200, 'Login successful', result);
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout({ tokenId: req.user.tokenId, tokenExp: req.user.tokenExp });
      res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
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
