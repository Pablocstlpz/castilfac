"use strict";
import { Router } from "express";
import { obtenerHistorialPreciosBase } from "../controllers/historialPreciosBase.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(autenticarToken);

router.get("/historialPreciosBase", obtenerHistorialPreciosBase);

export { router as historialPreciosBaseRoutes };
