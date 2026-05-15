"use strict";
import { Router } from "express";
import { obtenerElementos } from "../controllers/elementos.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(autenticarToken);

router.get("/elementos", obtenerElementos);

export { router as elementosRoutes };
