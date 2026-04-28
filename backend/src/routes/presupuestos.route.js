"use strict";

import express from "express";
import { getPresupuestos, getPresupuestoById } from "../controllers/presupuestos.controller.js";

const router = express.Router();

router.get("/empresas/:id/presupuestos", getPresupuestos);
router.get("/presupuestos/:id", getPresupuestoById);

export { router as presupuestosRoutes };
