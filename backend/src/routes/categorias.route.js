"use strict";

import { Router } from "express";
import {
  getCategoria,
  getCategorias,
} from "../controllers/categorias.controller.js";

const router = Router();

router.get("/categorias", getCategorias);
router.get("/categorias/:id", getCategoria);

export { router as categoriasRoutes };
