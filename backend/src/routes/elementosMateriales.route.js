"use strict";
import { Router } from "express";
import { obtenerElementosMateriales } from "../controllers/elementosMateriales.controller.js";

const router = Router();

router.get("/elementosMateriales", obtenerElementosMateriales);

export { router as elementosMaterialesRoutes };