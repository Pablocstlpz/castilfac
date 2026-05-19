"use strict";

import { Router } from "express";
import {
  crearSesionCheckout,
  verificarSesionPago,
} from "../controllers/stripe.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

//ojo: el webhook /stripe/webhook NO se monta aqui
//necesita el body en crudo (express.raw) para que stripe pueda validar la firma
//por eso lo monto directamente en app.js ANTES de express.json()
//si lo declarase aqui tambien, gana el primer registro y este no llegaria a ejecutarse (codigo muerto)

//crear sesion de checkout y verificar la sesion: solo usuarios autenticados
//NO aplico checkSuscripcion porque el usuario llega aqui justamente porque NO tiene suscripcion activa o se le acaba de vencer el trial
router.post("/stripe/crear-sesion", autenticarToken, crearSesionCheckout);
router.post("/stripe/verificar-sesion", autenticarToken, verificarSesionPago);

export { router as stripeRoutes };
