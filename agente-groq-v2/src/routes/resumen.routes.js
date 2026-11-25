// RUTAS DEL RESUMEN
import { Router } from 'express';
import { resumenConcierto } from '../controllers/resumen.controller.js';

const router = Router();

// GET /api/resumen/concierto/:concertId -> resumen de las valoraciones de un concierto
router.get('/concierto/:concertId', resumenConcierto);

export default router;
