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
import {
  validarLogin,
  validarRecuperarPassword,
  validarRestablecerPassword,
  validarRegistroInicial,
  validarCrearUsuario,
  validarActualizarUsuario,
  validarIdParam,
} from "../validators/usuarios.validator.js";
import {
  loginRateLimit,
  passwordResetRateLimit,
  registroRateLimit,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

//RUTAS PUBLICAS (no requieren JWT)
//cada una pasa por su rate-limit y su validator antes de llegar al controller
router.post(
  "/usuarios/login",
  loginRateLimit,
  validarLogin,
  getUsuarioCorreoContraseña,
);
router.post(
  "/usuarios/recuperar-password",
  passwordResetRateLimit,
  validarRecuperarPassword,
  solicitarRecuperacion,
);
router.post(
  "/usuarios/restablecer-password",
  passwordResetRateLimit,
  validarRestablecerPassword,
  restablecerPassword,
);
//registro inicial: SOLO crea el primer admin de una empresa recien creada y no verificada
//el controller valida estas invariantes para que no se use como puerta trasera
router.post(
  "/usuarios/registro-inicial",
  registroRateLimit,
  validarRegistroInicial,
  crearAdminInicial,
);

//a partir de aqui TODAS las rutas exigen JWT valido
router.use(autenticarToken);

//gestion de usuarios: solo admin / superadmin pueden listar y leer
router.get("/usuarios", autorizarRol(["admin", "superadmin"]), getUsuarios);
router.get(
  "/usuarios/:id",
  autorizarRol(["admin", "superadmin"]),
  validarIdParam,
  getUsuario,
);
router.get(
  "/usuarios/empresa/:empresa_id",
  autorizarRol(["admin", "superadmin"]),
  getUsuarioPorEmpresa,
);
router.post("/usuarios", autorizarRol(["admin"]), validarCrearUsuario, createUsuario);
router.put(
  "/usuarios/:id",
  autorizarRol(["admin"]),
  validarActualizarUsuario,
  updateUsuario,
);
router.delete(
  "/usuarios/:id",
  autorizarRol(["admin"]),
  validarIdParam,
  deleteUsuario,
);
//borrado por correo: solo superadmin (es una operacion masiva y poco habitual)
router.delete(
  "/usuarios/correo/:correo",
  autorizarRol(["superadmin"]),
  deleteUsuarioCorreo,
);

export { router as usuariosRoutes };
