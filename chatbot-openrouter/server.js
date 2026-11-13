require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  'Eres un asistente útil y amable. Responde siempre en español.';

// Permite leer JSON en las peticiones y sirve la carpeta "public" (el frontend)
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint que recibe el historial de la conversación y devuelve la respuesta de la IA
app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res
      .status(500)
      .json({ error: 'Falta OPENROUTER_API_KEY en el archivo .env' });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Debes enviar un array "messages".' });
  }

  // Solo aceptamos mensajes de usuario o asistente con texto,
  // y limitamos el historial a los últimos 20 para no gastar demasiados tokens
  const cleanMessages = messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
    )
    .slice(-20);

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': `http://localhost:${PORT}`,
          'X-Title': 'Chatbot Express',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...cleanMessages,
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || 'Error al llamar a OpenRouter';
      return res.status(response.status).json({ error: msg });
    }

    const reply = data.choices?.[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err) {
    console.error('Error en /api/chat:', err);
    res.status(500).json({ error: 'No se pudo conectar con OpenRouter.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
