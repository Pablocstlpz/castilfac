"use strict";

import express from "express";
import {
  getPresupuestos,
  getPresupuestoById,
  updatePresupuesto,
  createPresupuesto,
  patchEstadoPresupuesto,
} from "../controllers/presupuestos.controller.js";

const router = express.Router();

router.get("/empresas/:id/presupuestos", getPresupuestos);
router.get("/presupuestos/:id", getPresupuestoById);
router.put("/presupuestos/:id", updatePresupuesto);
router.patch("/presupuestos/:id/estado", patchEstadoPresupuesto);
router.post("/presupuestos", createPresupuesto);

export { router as presupuestosRoutes };
