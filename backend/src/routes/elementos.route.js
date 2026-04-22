"use strict";
import { Router } from "express";
import { obtenerElementos } from "../controllers/elementos.controller.js";

const router = Router();

router.get("/elementos", obtenerElementos);

export { router as elementosRoutes };