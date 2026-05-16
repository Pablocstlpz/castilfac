"use strict";

import { Router } from "express";
import {
  getEmpresas,
  getEmpresa,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaByNif,
  deleteEmpresaCorreo,
  verificarEmailEmpresa,
  reenviarVerificacionEmpresa,
  registroTransaccional,
} from "../controllers/empresas.controller.js";
import {
  autenticarToken,
  autorizarRol,
} from "../middlewares/auth.middleware.js";
import {
  validarCrearEmpresa,
  validarActualizarEmpresa,
  validarReenviarVerificacion,
  validarVerificarToken,
  validarNifParam,
  validarIdParam,
  validarRegistroTransaccional,
} from "../validators/empresas.validator.js";
import { registroRateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

//RUTAS PUBLICAS (necesarias en el flujo de registro / verificacion de email).
//Aplicamos rate limit para limitar abuso de creacion de empresas y de envio
//de emails de verificacion.

//Endpoint TRANSACCIONAL: crea empresa + admin en una sola tx.
//Es el endpoint recomendado para el formulario de registro publico.
router.post(
  "/empresas/registro",
  registroRateLimit,
  validarRegistroTransaccional,
  registroTransaccional,
);

//Endpoint legacy de creacion de empresa (sin admin). Lo mantenemos para no
//romper integraciones externas. El frontend del formulario de registro pasa
//a usar /empresas/registro.
router.post("/empresas", registroRateLimit, validarCrearEmpresa, createEmpresa);
router.get("/empresas/verificar/:token", validarVerificarToken, verificarEmailEmpresa);
router.post(
  "/empresas/reenviar-verificacion",
  registroRateLimit,
  validarReenviarVerificacion,
  reenviarVerificacionEmpresa,
);
router.get("/empresas/nif/:nif", validarNifParam, getEmpresaByNif);

//A partir de aqui, JWT obligatorio.
router.use(autenticarToken);

router.get("/empresas", autorizarRol(["superadmin"]), getEmpresas);
router.get("/empresas/:id", validarIdParam, getEmpresa);
router.put(
  "/empresas/:id",
  autorizarRol(["admin", "superadmin"]),
  validarActualizarEmpresa,
  updateEmpresa,
);
router.delete(
  "/empresas/:id",
  autorizarRol(["superadmin"]),
  validarIdParam,
  deleteEmpresa,
);
router.delete(
  "/empresas/correo/:correo",
  autorizarRol(["superadmin"]),
  deleteEmpresaCorreo,
);

export { router as empresasRoutes };
