"use strict";

import { Router } from "express";
import {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  deleteUsuarioCorreo,
  getUsuarioCorreoContraseña,
  getUsuarioPorEmpresa,
  solicitarRecuperacion,
  restablecerPassword,
  crearAdminInicial,
} from "../controllers/usuarios.controller.js";
import {
  autenticarToken,
  autorizarRol,
} from "../middlewares/auth.middleware.js";

const router = Router();

//RUTAS PUBLICAS (no requieren JWT):
//login, recuperacion de password y registro inicial del primer admin.
router.post("/usuarios/login", getUsuarioCorreoContraseña);
router.post("/usuarios/recuperar-password", solicitarRecuperacion);
router.post("/usuarios/restablecer-password", restablecerPassword);
//Registro inicial: SOLO sirve para crear el primer admin de una empresa
//recien creada y no verificada (el controlador valida estas invariantes).
router.post("/usuarios/registro-inicial", crearAdminInicial);

//A partir de aqui, TODAS las rutas requieren JWT valido.
router.use(autenticarToken);

//Gestion de usuarios: solo admin.
router.get("/usuarios", autorizarRol(["admin", "superadmin"]), getUsuarios);
router.get("/usuarios/:id", autorizarRol(["admin", "superadmin"]), getUsuario);
router.get(
  "/usuarios/empresa/:empresa_id",
  autorizarRol(["admin", "superadmin"]),
  getUsuarioPorEmpresa,
);
router.post("/usuarios", autorizarRol(["admin"]), createUsuario);
router.put("/usuarios/:id", autorizarRol(["admin"]), updateUsuario);
router.delete("/usuarios/:id", autorizarRol(["admin"]), deleteUsuario);
//Borrado por correo: superadmin unicamente (operacion masiva poco habitual).
router.delete(
  "/usuarios/correo/:correo",
  autorizarRol(["superadmin"]),
  deleteUsuarioCorreo,
);

export { router as usuariosRoutes };
