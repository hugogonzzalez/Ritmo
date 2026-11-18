// REPOSITORIO DE IA: la única parte que habla con Groq (gratis, sin tarjeta)
// Groq usa el mismo formato que OpenAI: solo cambian la dirección y la clave.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Prepara lo que enviamos a Groq
function crearCuerpo(mensajes, herramientas) {
  const cuerpo = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: mensajes,
    max_tokens: 300,   // respuestas cortas: ahorra límite de tokens
    temperature: 0.7,
  };
  // Solo enviamos herramientas si nos las pasan (el consejo del tiempo no las usa)
  if (herramientas && herramientas.length > 0) {
    cuerpo.tools = herramientas;
    cuerpo.tool_choice = 'auto';   // la IA decide si usar una herramienta o no
  }
  return cuerpo;
}

export async function llamarIA(mensajes, herramientas) {
  const respuesta = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(crearCuerpo(mensajes, herramientas)),
  });

  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`Groq respondió ${respuesta.status}: ${texto}`);
  }

  const datos = await respuesta.json();
  if (datos.error) {
    throw new Error(`Groq: ${datos.error.message}`);
  }

  // Devolvemos solo el mensaje de la IA
  return datos.choices[0].message;
}
