// SERVICE DEL RESUMEN: la LÓGICA del resumen de valoraciones de un concierto
// - Pide a la API de Ritmo los textos de las valoraciones
// - Pide a la IA un resumen corto
// - Guarda el resumen en caché para no gastar la cuota gratuita de Groq
import { llamarIA } from '../repositories/ia.repository.js';
import { obtenerDeCache, guardarEnCache } from '../repositories/cache.repository.js';

const API_URL = (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const UNA_HORA = 60 * 60 * 1000;
const MAX_COMENTARIOS = 40; // límite para no enviar demasiado texto a la IA
const MAX_CARACTERES = 300; // recorte de cada comentario

async function pedirTextos(concertId) {
  const respuesta = await fetch(`${API_URL}/comments/concert/${concertId}/textos`);
  if (!respuesta.ok) throw new Error(`La API de Ritmo respondió ${respuesta.status}`);
  const datos = await respuesta.json();
  return datos.data; // { titulo, comentarios }
}

// Una línea por valoración, con estrellas, entrada y ciudad
function describir(comentario) {
  const texto = comentario.text.length > MAX_CARACTERES
    ? `${comentario.text.slice(0, MAX_CARACTERES)}…`
    : comentario.text;
  return `- ${comentario.rating}/5 · ${comentario.entrada} (${comentario.ciudad}): "${texto}"`;
}

export async function resumirConcierto(concertId) {
  const { titulo, comentarios } = await pedirTextos(concertId);

  if (comentarios.length === 0) {
    return { titulo, total: 0, resumen: null };
  }

  // La clave cambia cuando llega una valoración nueva, así el resumen se regenera
  const clave = `resumen|${concertId}|${comentarios.length}|${comentarios[0].createdAt}`;
  const enCache = obtenerDeCache(clave);
  if (enCache) return enCache;

  const mensajes = [
    {
      role: 'system',
      content: 'Eres el asistente de una web de conciertos. Responde en español, en 2 o 3 frases, ' +
        'con un resumen de las valoraciones de un concierto: qué se valora bien y qué se critica. ' +
        'Basate solo en los comentarios que te doy, sin inventar datos. Si hay pocas valoraciones, dilo.',
    },
    {
      role: 'user',
      content: `Concierto: ${titulo}\nValoraciones:\n${comentarios.slice(0, MAX_COMENTARIOS).map(describir).join('\n')}`,
    },
  ];

  const respuesta = await llamarIA(mensajes); // sin herramientas: solo texto
  const resultado = {
    titulo,
    total: comentarios.length,
    resumen: respuesta.content?.trim() || null,
  };

  if (resultado.resumen) guardarEnCache(clave, resultado, UNA_HORA);
  return resultado;
}
