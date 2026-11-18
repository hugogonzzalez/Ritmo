# Agente Ritmo (backend): chatbot + tiempo de cada concierto

Un solo servidor en el puerto 3001 con:
- **Chatbot con IA** (Groq, gratis y sin tarjeta)
- **Tiempo de cada concierto** (Open-Meteo, gratis y sin clave)

## Arrancar

1. `npm install`
2. Copia `.env.example` a `.env` y pega tu clave de https://console.groq.com/keys
3. `npm run dev`
4. Debe salir: `Servidor en http://localhost:3001`

## Endpoints

### Chatbot
- `POST /api/chat` con `{ "mensaje": "hola", "sessionId": "abc" }` → `{ "respuesta": "..." }`
- `DELETE /api/chat/:sessionId` → borra la conversación

### Tiempo de un concierto
- `POST /api/tiempo/concierto` con `{ "nombre": "Noche de Rock", "ciudad": "Madrid", "fecha": "2026-11-20", "conConsejo": false }`
  - `conConsejo: false` devuelve solo el tiempo (lo usan las tarjetas de la tienda, sin gastar IA).
- `GET /api/tiempo?ciudad=Madrid&fecha=2026-11-20` → para probar en el navegador.
- Solo hay previsión para los próximos 16 días.
