"use strict";
import { Router } from "express";
import { obtenerHistorialPreciosEmpresa } from "../controllers/historialPreciosEmpresa.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = Router();

router.use(autenticarToken, checkSuscripcion);

router.get("/historialPreciosEmpresa", obtenerHistorialPreciosEmpresa);

export { router as historialPreciosEmpresaRoutes };
