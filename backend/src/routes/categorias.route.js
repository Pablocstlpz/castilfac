"use strict";

import { Router } from "express";
import {
  getCategoria,
  getCategorias,
} from "../controllers/categorias.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

//Las categorias son comunes a todas las empresas pero no son datos publicos:
//requieren JWT (no es necesaria suscripcion para listarlas).
router.use(autenticarToken);

router.get("/categorias", getCategorias);
router.get("/categorias/:id", getCategoria);

export { router as categoriasRoutes };
