"use strict"

import { Router } from 'express';
import express from 'express';
import { crearSesionCheckout, webhookStripe, verificarSesionPago } from '../controllers/stripe.controller.js';

const router = Router();

// el webhook necesita el body en crudo para que stripe pueda verificar la firma
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), webhookStripe);
router.post('/stripe/crear-sesion', crearSesionCheckout);
router.post('/stripe/verificar-sesion', verificarSesionPago);

export { router as stripeRoutes };
