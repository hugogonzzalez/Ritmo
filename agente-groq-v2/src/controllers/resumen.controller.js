// CONTROLLER DEL RESUMEN: valida el id y responde. No tiene lógica.
import { resumirConcierto } from '../services/resumen.service.js';

// GET /api/resumen/concierto/:concertId
export async function resumenConcierto(req, res) {
  const { concertId } = req.params;

  if (!/^[a-f\d]{24}$/i.test(concertId)) {
    return res.status(400).json({ error: 'El id del concierto no es válido' });
  }

  try {
    const resultado = await resumirConcierto(concertId);
    res.json(resultado);
  } catch (error) {
    console.error('Error del resumen:', error.message);
    res.status(500).json({ error: 'No se pudo generar el resumen en este momento.' });
  }
}
