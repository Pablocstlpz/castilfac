"use strict";
import { Router } from "express";
import { obtenerHistorialPreciosEmpresa } from "../controllers/historialPreciosEmpresa.controller.js";

const router = Router();

router.get("/historialPreciosEmpresa", obtenerHistorialPreciosEmpresa);

export { router as historialPreciosEmpresaRoutes };