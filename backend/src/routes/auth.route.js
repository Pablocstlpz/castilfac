"use strict";

import { Router } from "express";
import { loginGoogle } from "../controllers/auth.controller.js";
import { loginRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

//Aplicamos el mismo limite que en /usuarios/login: 5 intentos / 15 min por IP.
router.post("/auth/google", loginRateLimit, loginGoogle);

export { router as authRoutes };
