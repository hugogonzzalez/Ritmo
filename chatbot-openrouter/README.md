# Chatbot con Express y OpenRouter

Un chatbot sencillo: el backend en Express llama a OpenRouter y el frontend es una página con un chat.

## Estructura

```
chatbot-openrouter/
├── server.js          → servidor Express + endpoint /api/chat
├── public/index.html  → interfaz del chat
├── package.json       → dependencias y scripts
├── .env.example       → plantilla de variables de entorno
└── .gitignore
```

## Paso 1: conseguir una clave de OpenRouter

1. Entra en https://openrouter.ai y crea una cuenta.
2. Ve a la sección de API Keys y crea una clave nueva.
3. Copia la clave (empieza por `sk-or-v1-`).

## Paso 2: crear el archivo .env

1. Copia el archivo `.env.example` y renómbralo a `.env`.
2. Abre `.env` y pega tu clave en `OPENROUTER_API_KEY`.

El modelo (`OPENROUTER_MODEL`) puede ser cualquiera de los que aparecen en openrouter.ai/models. Ejemplos: `openai/gpt-4o-mini`, `anthropic/claude-3.5-haiku`.

## Paso 3: instalar dependencias

Necesitas Node.js 18 o superior. Luego, en la carpeta del proyecto:

```bash
npm install
```

## Paso 4: arrancar el servidor

```bash
npm start
```

Abre http://localhost:3000 en el navegador y escribe un mensaje.

Si quieres que se reinicie solo cuando cambias el código:

```bash
npm run dev
```

## Cómo funciona

1. El navegador guarda el historial de la conversación en una lista (`history`).
2. Cada vez que envías un mensaje, se manda ese historial a `POST /api/chat`.
3. `server.js` añade el mensaje de sistema (la personalidad del bot) y llama a `https://openrouter.ai/api/v1/chat/completions`.
4. La respuesta de la IA vuelve al navegador y se muestra en el chat.

## Ideas para ampliarlo

- Cambiar la personalidad del bot editando `SYSTEM_PROMPT` en `.env`.
- Guardar el historial en MongoDB para que no se pierda al recargar la página.
- Hacer el streaming de la respuesta para que aparezca palabra a palabra.
