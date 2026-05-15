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

const router = Router();

//Todas las rutas de clientes exigen JWT y suscripcion activa.
router.use(autenticarToken, checkSuscripcion);

router.get("/clientes/:empresa_id", getClientesByEmpresa);
router.get("/clientes/id/:id", getClienteById);
router.post("/clientes", addCliente);
router.put("/clientes/:id", updateCliente);
router.delete("/clientes/:id", deleteCliente);

export { router as clientesRoutes };
