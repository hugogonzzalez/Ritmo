// CONTROLLER DEL TIEMPO: recibe la petición (req), llama al service y responde (res)
import * as tiempoService from '../services/tiempo.service.js';

// POST /api/tiempo/concierto -> datos en req.body
// GET  /api/tiempo           -> datos en req.query
export async function tiempoConcierto(req, res) {
  const datos = req.method === 'GET' ? req.query : req.body;
  const { nombre, ciudad, fecha } = datos;
  // "conConsejo" llega como texto en la URL, por eso lo comparamos con 'false'
  const conConsejo = String(datos.conConsejo ?? 'true') !== 'false';

  if (!ciudad || !fecha) {
    return res.status(400).json({ error: 'Faltan "ciudad" o "fecha"' });
  }

  try {
    const resultado = await tiempoService.tiempoConcierto({ nombre, ciudad, fecha, conConsejo });
    res.json(resultado);
  } catch (error) {
    console.error('Error del tiempo:', error.message);
    res.status(500).json({ error: 'No se pudo obtener el tiempo' });
  }
}
