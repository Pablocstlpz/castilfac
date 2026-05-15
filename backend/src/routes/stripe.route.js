"use strict";

import { Router } from "express";
import express from "express";
import {
  crearSesionCheckout,
  webhookStripe,
  verificarSesionPago,
} from "../controllers/stripe.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

//El webhook es PUBLICO y necesita el body en crudo para verificar la firma de Stripe.
//Ya esta tambien montado directamente en app.js antes de express.json() para que el
//body crudo llegue intacto; lo dejamos aqui por compatibilidad.
router.post("/stripe/webhook", express.raw({ type: "application/json" }), webhookStripe);

//Crear sesion de checkout y verificar la sesion: SOLO usuarios autenticados.
//Aqui NO aplicamos checkSuscripcion porque el usuario llega justamente porque
//no tiene suscripcion activa o se le acaba de vencer el trial.
router.post("/stripe/crear-sesion", autenticarToken, crearSesionCheckout);
router.post("/stripe/verificar-sesion", autenticarToken, verificarSesionPago);

export { router as stripeRoutes };
