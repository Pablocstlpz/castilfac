"use strict";
import { Router } from "express";
import {
  getPlantillasProducto,
  getPlantillaProductoPorIdEmpresa,
} from "../controllers/plantillasProducto.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = Router();

router.use(autenticarToken, checkSuscripcion);

router.get("/plantillas-producto", getPlantillasProducto);
router.get(
  "/plantillas-producto/empresa/:id",
  getPlantillaProductoPorIdEmpresa,
);

export { router as plantillasProductosRoutes };
