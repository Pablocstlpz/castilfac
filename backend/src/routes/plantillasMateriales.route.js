"use strict";
import { Router } from "express";
import { getPlantillasMateriales } from "../controllers/plantillasMateriales.controller.js";

const router = Router();

// Ruta para obtener todas las plantillas de producto
router.get("/plantillas-materiales/:plantilla_id", getPlantillasMateriales);

export { router as plantillasMaterialesRoutes };
