// REPOSITORIO DE CACHÉ: guarda resultados durante un tiempo
// Sirve para no llamar a la IA una y otra vez con la misma pregunta
// (los modelos gratis tienen pocas peticiones al día).

const cache = new Map();

// Devuelve el dato si existe y no ha caducado. Si no, devuelve null.
export function obtenerDeCache(clave) {
  const guardado = cache.get(clave);
  if (!guardado) return null;

  if (Date.now() > guardado.caduca) {
    cache.delete(clave); // ya caducó, lo borramos
    return null;
  }
  return guardado.datos;
}

// Guarda un dato durante "duracionMs" milisegundos
export function guardarEnCache(clave, datos, duracionMs) {
  cache.set(clave, { datos, caduca: Date.now() + duracionMs });
}
