"use strict";
import { Router } from "express";
import { obtenerHistorialPreciosBase } from "../controllers/historialPreciosBase.controller.js";

const router = Router();

router.get("/historialPreciosBase", obtenerHistorialPreciosBase);

export { router as historialPreciosBaseRoutes };