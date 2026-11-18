// FRONTEND: envía los mensajes al servidor y los pinta en pantalla
const formulario = document.getElementById('formulario');
const entrada = document.getElementById('entrada');
const contenedor = document.getElementById('mensajes');
const btnBorrar = document.getElementById('btnBorrar');
const btnEnviar = formulario.querySelector('button');

// Un id único por pestaña para que el servidor recuerde la conversación
let sessionId = crypto.randomUUID();

function pintarMensaje(texto, tipo) {
  const div = document.createElement('div');
  div.className = `msg ${tipo}`;
  div.textContent = texto;
  contenedor.appendChild(div);
  contenedor.scrollTop = contenedor.scrollHeight; // baja al final
  return div;
}

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mensaje = entrada.value.trim();
  if (!mensaje) return;

  pintarMensaje(mensaje, 'user');
  entrada.value = '';
  btnEnviar.disabled = true;
  const pensando = pintarMensaje('Pensando...', 'bot');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, sessionId }),
    });
    const datos = await res.json();
    pensando.remove();

    if (!res.ok) throw new Error(datos.error);
    pintarMensaje(datos.respuesta, 'bot');
  } catch (error) {
    pensando.remove();
    pintarMensaje('Error: ' + error.message, 'error');
  } finally {
    btnEnviar.disabled = false;
    entrada.focus();
  }
});

btnBorrar.addEventListener('click', async () => {
  await fetch(`/api/chat/${sessionId}`, { method: 'DELETE' });
  sessionId = crypto.randomUUID();
  contenedor.innerHTML = '';
  pintarMensaje('Conversación nueva. ¿En qué te ayudo?', 'bot');
});
