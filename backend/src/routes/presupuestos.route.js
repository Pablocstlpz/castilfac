"use strict";

import express from "express";
import {
  getPresupuestos,
  getPresupuestoById,
  updatePresupuesto,
  createPresupuesto,
  patchEstadoPresupuesto,
} from "../controllers/presupuestos.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = express.Router();

//Todas las rutas de presupuestos requieren JWT y suscripcion vigente.
router.use(autenticarToken, checkSuscripcion);

router.get("/empresas/:id/presupuestos", getPresupuestos);
router.get("/presupuestos/:id", getPresupuestoById);
router.put("/presupuestos/:id", updatePresupuesto);
router.patch("/presupuestos/:id/estado", patchEstadoPresupuesto);
router.post("/presupuestos", createPresupuesto);

export { router as presupuestosRoutes };
