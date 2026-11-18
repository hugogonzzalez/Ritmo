// SERVICE DEL CHAT: la LÓGICA del chatbot
// - Recupera el historial
// - Llama al agente
// - Guarda la respuesta
import { ejecutarAgente } from '../agent/agent.js';
import {
  obtenerHistorial,
  guardarHistorial,
  borrarHistorial,
} from '../repositories/conversacion.repository.js';

export async function responderMensaje(sessionId, mensaje) {
  // 1) Copiamos el historial y añadimos el mensaje del usuario
  const historial = [...obtenerHistorial(sessionId)];
  historial.push({ role: 'user', content: mensaje });

  // 2) El agente piensa, usa herramientas si hace falta y responde
  //    (si falla, lanza error y NO guardamos nada)
  const respuesta = await ejecutarAgente(historial);

  // 3) Guardamos la respuesta en el historial
  historial.push({ role: 'assistant', content: respuesta });
  guardarHistorial(sessionId, historial);

  return respuesta;
}

export function borrarConversacion(sessionId) {
  borrarHistorial(sessionId);
}
