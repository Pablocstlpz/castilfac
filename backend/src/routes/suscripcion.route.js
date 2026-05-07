"use strict"

import { Router } from 'express';
import { verificarSuscripcion } from '../controllers/suscripcion.controller.js';

const router = Router();

router.get('/suscripcion/check/:empresa_id', verificarSuscripcion);

export { router as suscripcionRoutes };
