"use strict";
import { Router } from "express";
import { obtenerElementosMateriales } from "../controllers/elementosMateriales.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(autenticarToken);

router.get("/elementosMateriales", obtenerElementosMateriales);

export { router as elementosMaterialesRoutes };
