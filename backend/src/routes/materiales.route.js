"use strict";

import { Router } from "express";
import {
  obtenerMateriales,
  obtenerMaterialesConPrecioEmpresa,
  obtenerMaterialPorId,
  toggleActivoMaterial,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
} from "../controllers/materiales.controller.js";

const router = Router();

router.get("/materiales/empresa/:empresa_id", obtenerMaterialesConPrecioEmpresa);
router.get("/materiales", obtenerMateriales);
router.get("/materiales/:id", obtenerMaterialPorId);
router.post("/materiales", crearMaterial);
router.put("/materiales/:id", actualizarMaterial);
router.delete("/materiales/:id", eliminarMaterial);
router.patch("/materiales/:id/activo", toggleActivoMaterial);

export { router as materialesRoutes };
