// RUTAS DEL TIEMPO
import { Router } from 'express';
import { tiempoConcierto } from '../controllers/tiempo.controller.js';

const router = Router();

// POST /api/tiempo/concierto -> lo usa la web (datos en el body)
router.post('/concierto', tiempoConcierto);

// GET /api/tiempo?ciudad=Madrid&fecha=2026-11-22 -> para probar desde el navegador (datos en la URL)
router.get('/', tiempoConcierto);

export default router;
