// Nombre y opciones de la cookie que guarda el JWT.
// httpOnly: el JavaScript del navegador no puede leerla (protege frente a robos por XSS).
const AUTH_COOKIE_NAME = 'ritmo_token';

const getAuthCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  // En producción solo viaja por HTTPS
  secure: process.env.NODE_ENV === 'production',
  path: '/'
});

module.exports = { AUTH_COOKIE_NAME, getAuthCookieOptions };
