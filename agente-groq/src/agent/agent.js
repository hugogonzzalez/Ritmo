// AGENTE: el "cerebro". Repite el ciclo pensar -> usar herramienta -> pensar
// hasta que la IA da una respuesta final.
import { llamarIA } from '../repositories/ia.repository.js';
import { herramientas, definicionesHerramientas } from './tools.js';

// Instrucciones fijas que definen la personalidad del chatbot
const PROMPT_SISTEMA = `Eres un asistente amable que responde en español.
Si te preguntan la fecha u hora, usa la herramienta obtener_fecha_hora.
Si te piden una cuenta matemática, usa la herramienta calcular.
Si te preguntan qué tiempo hará en una ciudad o en un concierto, usa la herramienta obtener_tiempo.
Para saber la fecha de "mañana", "el sábado"... usa antes obtener_fecha_hora.`;

const MAX_PASOS = 5; // evita bucles infinitos

export async function ejecutarAgente(historial) {
  // Mensajes de trabajo: sistema + conversación
  const mensajes = [{ role: 'system', content: PROMPT_SISTEMA }, ...historial];

  for (let paso = 1; paso <= MAX_PASOS; paso++) {
    // 1) Preguntamos a la IA
    const mensajeIA = await llamarIA(mensajes, definicionesHerramientas);
    mensajes.push(mensajeIA);

    // 2) Si NO pide herramientas, ya tenemos la respuesta final
    if (!mensajeIA.tool_calls || mensajeIA.tool_calls.length === 0) {
      return mensajeIA.content;
    }

    // 3) Si pide herramientas, las ejecutamos una a una
    for (const llamada of mensajeIA.tool_calls) {
      const nombre = llamada.function.name;
      const argumentos = JSON.parse(llamada.function.arguments || '{}');
      const herramienta = herramientas[nombre];

      // "await" porque algunas herramientas (como el tiempo) llaman a internet
      let resultado;
      try {
        resultado = herramienta
          ? await herramienta.ejecutar(argumentos)
          : `La herramienta ${nombre} no existe`;
      } catch (error) {
        resultado = `Error en la herramienta: ${error.message}`;
      }
      // La IA necesita texto: si es un objeto, lo pasamos a JSON
      if (typeof resultado !== 'string') resultado = JSON.stringify(resultado);

      console.log(`🔧 Herramienta usada: ${nombre}`, argumentos, '->', resultado);

      // 4) Le devolvemos el resultado a la IA
      mensajes.push({
        role: 'tool',
        tool_call_id: llamada.id,
        content: resultado,
      });
    }
    // y el bucle vuelve a empezar para que la IA use el resultado
  }

  return 'Lo siento, no he podido terminar la tarea.';
}
