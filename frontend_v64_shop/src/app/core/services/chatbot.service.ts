import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

// Habla con el backend del agente IA (puerto 3001).
// Usa fetch y no HttpClient para no pasar por los interceptores de la tienda.
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  async enviar(mensaje: string, sessionId: string): Promise<string> {
    let respuesta: Response;
    try {
      respuesta = await fetch(environment.chatbotUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, sessionId })
      });
    } catch {
      throw new Error('No puedo conectar con el asistente. Comprueba que el servidor del chat está en marcha en el puerto 3001.');
    }

    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error ?? 'El asistente no pudo responder. Inténtalo de nuevo.');
    }
    return datos.respuesta as string;
  }
}
