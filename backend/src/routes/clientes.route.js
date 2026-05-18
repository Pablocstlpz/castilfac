"use strict";

import { Router } from "express";
import {
  getClientesByEmpresa,
  getClienteById,
  addCliente,
  updateCliente,
  deleteCliente,
} from "../controllers/clientes.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";
import {
  validarCrearCliente,
  validarActualizarCliente,
  validarIdParam,
  validarEmpresaIdParam,
} from "../validators/clientes.validator.js";

const router = Router();

//todas las rutas de clientes requieren JWT y suscripcion activa
router.use(autenticarToken, checkSuscripcion);

router.get("/clientes/:empresa_id", validarEmpresaIdParam, getClientesByEmpresa);
router.get("/clientes/id/:id", validarIdParam, getClienteById);
router.post("/clientes", validarCrearCliente, addCliente);
router.put("/clientes/:id", validarActualizarCliente, updateCliente);
router.delete("/clientes/:id", validarIdParam, deleteCliente);

export { router as clientesRoutes };
