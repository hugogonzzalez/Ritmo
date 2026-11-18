// REPOSITORIO DE CONVERSACIONES: guarda el historial de cada chat
// Ahora se guarda en memoria (un Map). Si mañana lo quieres en MongoDB,
// solo cambias ESTE archivo y el resto del proyecto sigue igual.

// clave: sessionId  ->  valor: array de mensajes
const conversaciones = new Map();

export function obtenerHistorial(sessionId) {
  return conversaciones.get(sessionId) || [];
}

export function guardarHistorial(sessionId, historial) {
  conversaciones.set(sessionId, historial);
}

export function borrarHistorial(sessionId) {
  conversaciones.delete(sessionId);
}
