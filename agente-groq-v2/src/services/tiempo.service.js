// SERVICE DEL TIEMPO: la LÓGICA
// - Comprueba que la fecha sirve
// - Traduce los códigos del tiempo a texto
// - Pide a la IA un consejo
// - Usa la caché para ahorrar peticiones
import { buscarCiudad, obtenerPrevisionDia } from '../repositories/tiempo.repository.js';
import { llamarIA } from '../repositories/ia.repository.js';
import { obtenerDeCache, guardarEnCache } from '../repositories/cache.repository.js';

const DIAS_MAXIMOS = 16;          // Open-Meteo solo da previsión de 16 días
const UNA_HORA = 60 * 60 * 1000;  // tiempo que guardamos en caché

// Open-Meteo devuelve un número (weather_code). Lo traducimos a texto.
const DESCRIPCIONES = {
  0: 'Despejado', 1: 'Casi despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Niebla', 48: 'Niebla con escarcha',
  51: 'Llovizna débil', 53: 'Llovizna', 55: 'Llovizna intensa',
  61: 'Lluvia débil', 63: 'Lluvia', 65: 'Lluvia fuerte',
  66: 'Lluvia helada', 67: 'Lluvia helada fuerte',
  71: 'Nieve débil', 73: 'Nieve', 75: 'Nieve fuerte', 77: 'Granos de nieve',
  80: 'Chubascos débiles', 81: 'Chubascos', 82: 'Chubascos fuertes',
  85: 'Chubascos de nieve', 86: 'Chubascos de nieve fuertes',
  95: 'Tormenta', 96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo',
};

// Un icono según el código, para que el frontend lo pinte
function icono(codigo) {
  if (codigo === 0 || codigo === 1) return '☀️';
  if (codigo === 2) return '⛅';
  if (codigo === 3 || codigo === 45 || codigo === 48) return '☁️';
  if (codigo >= 51 && codigo <= 67) return '🌧️';
  if (codigo >= 71 && codigo <= 77) return '❄️';
  if (codigo >= 80 && codigo <= 86) return '🌦️';
  if (codigo >= 95) return '⛈️';
  return '🌡️';
}

// Cuántos días faltan desde hoy hasta la fecha ("2026-11-20")
function diasHasta(fecha) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(fecha + 'T00:00:00');
  return Math.round((dia - hoy) / (1000 * 60 * 60 * 24));
}

// 1) SOLO EL TIEMPO (lo usa también la herramienta del chatbot)
export async function obtenerTiempo(ciudad, fecha) {
  const dias = diasHasta(fecha);
  if (isNaN(dias)) {
    return { disponible: false, motivo: 'La fecha no es válida (usa AAAA-MM-DD)' };
  }
  if (dias < 0) {
    return { disponible: false, motivo: 'El concierto ya ha pasado' };
  }
  if (dias > DIAS_MAXIMOS) {
    return {
      disponible: false,
      motivo: `Aún falta mucho: la previsión estará disponible dentro de ${dias - DIAS_MAXIMOS} días`,
    };
  }

  const lugar = await buscarCiudad(ciudad);
  if (!lugar) return { disponible: false, motivo: `No encuentro la ciudad "${ciudad}"` };

  const prevision = await obtenerPrevisionDia(lugar.latitud, lugar.longitud, fecha);

  return {
    disponible: true,
    ciudad: `${lugar.nombre}, ${lugar.pais}`,
    fecha,
    descripcion: DESCRIPCIONES[prevision.codigo] || 'Desconocido',
    icono: icono(prevision.codigo),
    maxima: Math.round(prevision.maxima),
    minima: Math.round(prevision.minima),
    probabilidadLluvia: prevision.probabilidadLluvia ?? 0,
  };
}

// Pide a la IA una frase corta con un consejo
async function generarConsejo(nombre, tiempo) {
  const mensajes = [
    {
      role: 'system',
      content: 'Eres el asistente de una web de conciertos. Responde en español, ' +
        'en UNA o DOS frases cortas, con un tono cercano. Da un consejo práctico ' +
        '(ropa, paraguas, agua, protección solar...) según el tiempo. Puedes usar 1 emoji.',
    },
    {
      role: 'user',
      content: `Concierto: ${nombre}. Ciudad: ${tiempo.ciudad}. Fecha: ${tiempo.fecha}.
Tiempo: ${tiempo.descripcion}, máxima ${tiempo.maxima}°C, mínima ${tiempo.minima}°C,
probabilidad de lluvia ${tiempo.probabilidadLluvia}%.`,
    },
  ];

  const respuesta = await llamarIA(mensajes); // sin herramientas: solo texto
  return respuesta.content?.trim() || null;
}

// 2) TIEMPO + CONSEJO DE IA para un concierto
export async function tiempoConcierto({ nombre, ciudad, fecha, conConsejo = true }) {
  // ¿Ya lo tenemos guardado?
  const clave = `${ciudad.toLowerCase()}|${fecha}|${nombre || ''}|${conConsejo ? 'con' : 'sin'}`;
  const enCache = obtenerDeCache(clave);
  if (enCache) return enCache;

  // Datos reales del tiempo
  const tiempo = await obtenerTiempo(ciudad, fecha);
  if (!tiempo.disponible) return { tiempo, consejo: null };

  // Sin consejo: no gastamos la IA (las tarjetas solo necesitan el tiempo)
  if (!conConsejo) {
    const resultado = { tiempo, consejo: null };
    guardarEnCache(clave, resultado, UNA_HORA);
    return resultado;
  }

  // Consejo con IA. Si la IA falla, devolvemos el tiempo igualmente
  let consejo = null;
  try {
    consejo = await generarConsejo(nombre || 'el concierto', tiempo);
  } catch (error) {
    console.warn('La IA no pudo dar consejo:', error.message);
  }

  const resultado = { tiempo, consejo };

  // Solo guardamos en caché si la IA respondió bien
  if (consejo) guardarEnCache(clave, resultado, UNA_HORA);

  return resultado;
}
