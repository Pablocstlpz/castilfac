"use strict";

import { Router } from 'express';
import express from 'express';
import { crearSesionCheckout, webhookStripe } from '../controllers/stripe.controller.js';

const router = Router();

// El webhook requiere el body en crudo (sin parsear) para verificar la firma de Stripe
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), webhookStripe);
router.post('/stripe/crear-sesion', crearSesionCheckout);

export { router as stripeRoutes };
