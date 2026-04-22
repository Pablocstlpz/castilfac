"use strict";
import { Router } from "express";
import {
  getPlantillasProducto,
  getPlantillaProductoPorIdEmpresa,
} from "../controllers/plantillasProducto.controller.js";

const router = Router();

// Ruta para obtener todas las plantillas de producto
router.get("/plantillas-producto", getPlantillasProducto);
// Ruta para obtener una plantilla de producto por ID de empresa
router.get(
  "/plantillas-producto/empresa/:id",
  getPlantillaProductoPorIdEmpresa,
);

export { router as plantillasProductosRoutes };
