"use strict";

import { Router } from "express";
import {
  obtenerMateriales,
  obtenerMaterialPorId,
  toggleActivoMaterial,
} from "../controllers/materiales.controller.js";

const router = Router();

router.get("/materiales", obtenerMateriales);
router.get("/materiales/:id", obtenerMaterialPorId);
router.patch("/materiales/:id/activo", toggleActivoMaterial);

export { router as materialesRoutes };
