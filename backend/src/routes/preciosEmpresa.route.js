"use strict";
import { Router } from "express";
import {
  getPrecioEmpresa,
  actualizarPrecioPvp,
} from "../controllers/preciosEmpresa.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = Router();

router.use(autenticarToken, checkSuscripcion);

// Ruta para actualizar el PVP empresa de un material con registro automático en historial
router.put("/precios/actualizar", actualizarPrecioPvp);

// Ruta para obtener todos los precios de empresa por empresa_id
router.get("/precios/:id", getPrecioEmpresa);

export { router as preciosEmpresaRoutes };
