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

//RUTAS PUBLICAS (las necesito en el flujo de registro y verificacion por email)
//aplico rate-limit para limitar abuso de creacion de empresas y envio de emails de verificacion

//endpoint TRANSACCIONAL: crea empresa + admin en una sola transaccion
//es el endpoint que usa el formulario de registro publico del frontend
router.post(
  "/empresas/registro",
  registroRateLimit,
  validarRegistroTransaccional,
  registroTransaccional,
);

//endpoint legacy de creacion de empresa sin admin
//lo mantengo por compatibilidad con integraciones externas, pero el form de registro ya no lo usa
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
//Usamos prefijo "/empresas" para que este middleware NO capture rutas de otros
//routers (ej. POST /usuarios/login) que pasan por aqui antes de llegar a su router.
router.use("/empresas", autenticarToken);

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
