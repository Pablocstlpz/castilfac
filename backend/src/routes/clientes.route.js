"use strict";

import { Router } from "express";
import {
  getClientesByEmpresa,
  getClienteById,
  addCliente,
  updateCliente,
  deleteCliente,
} from "../controllers/clientes.controller.js";

const router = Router();

router.get("/clientes/:empresa_id", getClientesByEmpresa);
router.get("/clientes/id/:id", getClienteById);
router.post("/clientes", addCliente);
router.put("/clientes/:id", updateCliente);
router.delete("/clientes/:id", deleteCliente);

export { router as clientesRoutes };
