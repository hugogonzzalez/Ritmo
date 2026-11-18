// CONTROLLER DEL CHAT: recibe la petición (req), llama al service y responde (res)
// No tiene lógica: solo valida los datos y devuelve la respuesta.
import * as chatService from '../services/chat.service.js';

// POST /api/chat
export async function enviarMensaje(req, res) {
  const { mensaje, sessionId } = req.body;

  if (!mensaje || !sessionId) {
    return res.status(400).json({ error: 'Faltan "mensaje" o "sessionId"' });
  }

  try {
    const respuesta = await chatService.responderMensaje(sessionId, mensaje);
    res.json({ respuesta });
  } catch (error) {
    console.error('Error del agente:', error.message);
    res.status(500).json({ error: 'El agente no pudo responder. Revisa la consola del servidor.' });
  }
}

// DELETE /api/chat/:sessionId
export function borrarConversacion(req, res) {
  chatService.borrarConversacion(req.params.sessionId);
  res.json({ ok: true });
}
