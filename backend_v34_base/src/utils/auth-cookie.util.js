const { REFRESH_TTL_MS } = require('./refresh-token.util');

// access_token: va en todas las peticiones y caduca cada hora
// refresh_token: solo se envía a /api/auth (refresco y logout) y dura 15 días
const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const LEGACY_COOKIE_NAME = 'ritmo_token';
const ACCESS_MAX_AGE_MS = 60 * 60 * 1000;
const REFRESH_PATH = '/api/auth';

const opcionesBase = () => ({
  httpOnly: true,                                    // el JavaScript del navegador no puede leerlas
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'      // en producción solo viajan por HTTPS
});

const getAccessCookieOptions = () => ({ ...opcionesBase(), path: '/', maxAge: ACCESS_MAX_AGE_MS });
const getRefreshCookieOptions = () => ({ ...opcionesBase(), path: REFRESH_PATH, maxAge: REFRESH_TTL_MS });

// Borra las dos cookies (y la antigua, por si el navegador todavía la tiene)
const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...opcionesBase(), path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...opcionesBase(), path: REFRESH_PATH });
  res.clearCookie(LEGACY_COOKIE_NAME, { ...opcionesBase(), path: '/' });
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  AUTH_COOKIE_NAME: ACCESS_COOKIE_NAME,   // alias: el middleware sigue leyendo este nombre
  getAccessCookieOptions,
  getRefreshCookieOptions,
  clearAuthCookies
};
