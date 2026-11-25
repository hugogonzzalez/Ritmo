// RUTAS: dicen qué función se ejecuta en cada URL
import { Router } from 'express';
import { enviarMensaje, borrarConversacion } from '../controllers/chat.controller.js';

const router = Router();

// POST /api/chat          -> enviar un mensaje al agente
router.post('/', enviarMensaje);

// DELETE /api/chat/:sessionId -> borrar el historial de una conversación
router.delete('/:sessionId', borrarConversacion);

export default router;
