"use strict";

import { Router } from "express";
import { loginGoogle, refrescarToken } from "../controllers/auth.controller.js";
import { loginRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

//login con google: rate-limit igual que /usuarios/login (5 intentos cada 15 min por IP)
router.post("/auth/google", loginRateLimit, loginGoogle);

//POST /auth/refresh -> intercambia un refresh token valido por una nueva pareja { accessToken, refreshToken }
//NO requiere autenticarToken porque el access puede estar caducado; la prueba de identidad es el refresh
//uso el mismo rate-limit que el login porque el refresh es un "login implicito"
router.post("/auth/refresh", loginRateLimit, refrescarToken);

export { router as authRoutes };
