// Utilidades comunes para los listados del panel de admin:
// búsqueda de texto, filtro de activos, orden y paginación.

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Parámetros que indican que la petición viene del panel de admin (y espera paginación).
// Si no llega ninguno, el endpoint devuelve la lista de siempre, sin cambios.
const PAGINATION_PARAMS = ['page', 'limit', 'search', 'sort', 'active'];

const isPaginatedRequest = (query = {}) => PAGINATION_PARAMS.some(key => query[key] !== undefined);

// Escapa caracteres especiales para usarlos dentro de una expresión regular
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lee página, límite, búsqueda, activo/inactivo y orden de req.query
// sortOptions: { clave: criterioDeMongo }. Si la clave no existe se usa defaultSort.
const parseListParams = (query = {}, sortOptions = {}, defaultSort = null) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const active = ['true', 'false'].includes(query.active) ? query.active : 'all';
  const sortKey = Object.prototype.hasOwnProperty.call(sortOptions, query.sort) ? query.sort : defaultSort;
  const sort = sortKey ? sortOptions[sortKey] : {};

  return { page, limit, search, active, sort };
};

// Condición de texto: el texto debe aparecer en alguno de los campos indicados
const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  const regex = { $regex: escapeRegex(search), $options: 'i' };
  return { $or: fields.map(field => ({ [field]: regex })) };
};

// Condición de activo: 'all' no filtra, 'true' solo activos, 'false' solo inactivos
const buildActiveFilter = (active) => {
  if (active === 'true') return { isActive: true };
  if (active === 'false') return { isActive: false };
  return {};
};

// Ejecuta la consulta con página y devuelve { data, pagination }
const runPaginatedQuery = async ({ model, filter, sort, page, limit, populate = (q) => q }) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    populate(model.find(filter).sort(sort).skip(skip).limit(limit)).lean(),
    model.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Precio de la URL: número >= 0, o null si está vacío o no es válido
const parseOptionalPrice = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// Fecha de la URL (AAAA-MM-DD). Con endOfDay, el "hasta" incluye todo el día.
const parseDateParam = (value, endOfDay = false) => {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(endOfDay ? `${value}T23:59:59.999` : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

module.exports = {
  isPaginatedRequest,
  parseListParams,
  buildSearchFilter,
  buildActiveFilter,
  runPaginatedQuery,
  parseOptionalPrice,
  parseDateParam,
  escapeRegex
};
