"use strict";
import { Router } from "express";
import { getPrecioEmpresa } from "../controllers/preciosEmpresa.controller.js";

const router = Router();

// Ruta para obtener un precio por su ID
router.get("/precios/:id", getPrecioEmpresa);

export { router as preciosEmpresaRoutes };
