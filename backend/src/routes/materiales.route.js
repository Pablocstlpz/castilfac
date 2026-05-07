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

// Listado enriquecido con precio de empresa (para catálogo / tabla de precios)
router.get("/materiales/empresa/:empresa_id", obtenerMaterialesConPrecioEmpresa);

// Listado base (para selects de formularios, etc.)
router.get("/materiales/empresa/:empresa_id/lista", obtenerMateriales);

// CRUD individual — todos los endpoints exigen empresa_id en la URL para garantizar aislamiento
router.get("/materiales/empresa/:empresa_id/:id", obtenerMaterialPorId);
router.post("/materiales/empresa/:empresa_id", crearMaterial);
router.put("/materiales/empresa/:empresa_id/:id", actualizarMaterial);
router.delete("/materiales/empresa/:empresa_id/:id", eliminarMaterial);
router.patch("/materiales/empresa/:empresa_id/:id/activo", toggleActivoMaterial);

export { router as materialesRoutes };
