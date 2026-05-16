"use strict";

import { Router } from "express";
import {
  crearSesionCheckout,
  verificarSesionPago,
} from "../controllers/stripe.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

//NOTA: el webhook /stripe/webhook NO se monta aqui. Necesita el body en crudo
//(express.raw) para que la firma de Stripe valide bien, asi que se monta
//directamente en app.js ANTES de express.json(). Si lo declaras tambien aqui,
//gana el primer registro y este nunca llega a ejecutarse -> codigo muerto.

//Crear sesion de checkout y verificar la sesion: SOLO usuarios autenticados.
//No aplicamos checkSuscripcion porque el usuario llega justamente porque NO
//tiene suscripcion activa o se le acaba de vencer el trial.
router.post("/stripe/crear-sesion", autenticarToken, crearSesionCheckout);
router.post("/stripe/verificar-sesion", autenticarToken, verificarSesionPago);

export { router as stripeRoutes };
