"use strict";
import { Router } from "express";
import { getPlantillasMateriales } from "../controllers/plantillasMateriales.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = Router();

router.use(autenticarToken, checkSuscripcion);

router.get("/plantillas-materiales/:plantilla_id", getPlantillasMateriales);

export { router as plantillasMaterialesRoutes };
