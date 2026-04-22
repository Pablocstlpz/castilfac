"use strict";

import { Router } from "express";
import {
  obtenerMateriales,
  obtenerMaterialPorId,
} from "../controllers/materiales.controller.js";

const router = Router();

// Ruta para obtener todos los materiales
router.get("/materiales", obtenerMateriales);
// Ruta para obtener un material por su ID
router.get("/materiales/:id", obtenerMaterialPorId);

export { router as materialesRoutes };
