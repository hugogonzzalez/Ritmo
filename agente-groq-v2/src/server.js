// PUNTO DE ENTRADA: arranca el servidor Express
import 'dotenv/config';            // carga las variables del archivo .env
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.routes.js';
import tiempoRoutes from './routes/tiempo.routes.js';
import resumenRoutes from './routes/resumen.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname no existe en módulos ES, así que lo calculamos
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(cors());                 // permite peticiones desde otros orígenes
app.use(express.json());         // permite leer JSON en req.body

// Sirve la página del chat (carpeta public)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API
app.use('/api/chat', chatRoutes);
app.use('/api/tiempo', tiempoRoutes);
app.use('/api/resumen', resumenRoutes);

// Comprobamos que la clave existe antes de arrancar
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  Falta GROQ_API_KEY en el archivo .env');
}

app.listen(PORT, () => {
  console.log(`✅ Servidor en http://localhost:${PORT}`);
});
