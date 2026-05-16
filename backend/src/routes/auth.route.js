"use strict";

import { Router } from "express";
import { loginGoogle, refrescarToken } from "../controllers/auth.controller.js";
import { loginRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

//Login con Google: rate-limit como /usuarios/login (5 intentos / 15 min por IP).
router.post("/auth/google", loginRateLimit, loginGoogle);

//POST /auth/refresh: intercambia un refresh token valido por una nueva pareja
//{ accessToken, refreshToken }. NO requiere autenticarToken porque el access
//puede estar caducado; la prueba de identidad es el refresh.
//
//El rate-limit es el mismo del login porque el refresh es un "login implicito".
router.post("/auth/refresh", loginRateLimit, refrescarToken);

export { router as authRoutes };
