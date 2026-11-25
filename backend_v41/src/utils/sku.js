const { randomUUID } = require('node:crypto');
const AppError = require('./app-error');

const normalizeSku = (sku) => String(sku).trim().toUpperCase();

// Genera un SKU con la sesión, la fecha de inicio y un sufijo aleatorio
// Ejemplo: VAR-93F2A-20261023-2030-8712A988
const generateSku = (performanceId, startsAt) => {
  if (!performanceId) throw new AppError('performanceId es obligatorio', 400);

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) throw new AppError('startsAt debe ser una fecha válida', 400);

  const performanceCode = performanceId.toString().slice(-5).toUpperCase();
  const dateCode = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeCode = date.toISOString().slice(11, 16).replace(':', '');
  const randomCode = randomUUID().slice(0, 8).toUpperCase();

  return `VAR-${performanceCode}-${dateCode}-${timeCode}-${randomCode}`;
};

module.exports = { normalizeSku, generateSku };
