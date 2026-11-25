import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TiempoConcierto } from '../models/tiempo.model';

// Pide al backend del agente el tiempo de un día de concierto (sin consejo, para no gastar la IA)
@Injectable({ providedIn: 'root' })
export class TiempoService {
  async obtener(nombre: string, ciudad: string, fecha: string): Promise<TiempoConcierto> {
    const respuesta = await fetch(environment.tiempoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, ciudad, fecha, conConsejo: false })
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(datos.error ?? 'No se pudo obtener el tiempo.');
    }
    return datos as TiempoConcierto;
  }
}
