"use strict";

import express from "express";
import { getPresupuestos } from "../controllers/presupuestos.controller.js";

const router = express.Router();

router.get("/empresas/:id/presupuestos", getPresupuestos);

export { router as presupuestosRoutes };
