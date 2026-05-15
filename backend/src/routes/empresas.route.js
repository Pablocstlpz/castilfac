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
} from "../controllers/empresas.controller.js";
import {
  autenticarToken,
  autorizarRol,
} from "../middlewares/auth.middleware.js";

const router = Router();

//RUTAS PUBLICAS (necesarias en el flujo de registro / verificacion de email):
router.post("/empresas", createEmpresa); //alta de empresa (registro publico)
router.get("/empresas/verificar/:token", verificarEmailEmpresa); //click en email
router.post("/empresas/reenviar-verificacion", reenviarVerificacionEmpresa);
//Lookup por NIF: usado durante el registro para resolver el id recien creado.
//Lo mantenemos publico para no romper el flujo actual; el toJSON del modelo
//ya filtra token_verificacion para que no se exponga.
router.get("/empresas/nif/:nif", getEmpresaByNif);

//A partir de aqui, JWT obligatorio.
router.use(autenticarToken);

router.get("/empresas", autorizarRol(["superadmin"]), getEmpresas);
router.get("/empresas/:id", getEmpresa); //cualquier autenticado puede leer su empresa
router.put("/empresas/:id", autorizarRol(["admin", "superadmin"]), updateEmpresa);
router.delete("/empresas/:id", autorizarRol(["superadmin"]), deleteEmpresa);
router.delete(
  "/empresas/correo/:correo",
  autorizarRol(["superadmin"]),
  deleteEmpresaCorreo,
);

export { router as empresasRoutes };
