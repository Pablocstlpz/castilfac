import { body, param } from "express-validator";

import {
  LIMITES,
  REGEX_NOMBRE_PERSONA,
} from "../utils/regex.js";
import { handleValidation } from "./_handle.js";

//roles que acepto al crear/actualizar un usuario
const ROLES = ["admin", "operario", "superadmin"];

//validador para POST /usuarios/login (el frontend manda { correo, contraseña })
export const validarLogin = [
  body("correo")
    .isString()
    .withMessage("El correo debe ser una cadena de texto")
    .trim()
    .notEmpty()
    .withMessage("El correo es requerido")
    .isEmail()
    .withMessage("El correo no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .withMessage(`El correo no puede superar ${LIMITES.EMAIL_MAX} caracteres`)
    .normalizeEmail(),
  body("contraseña")
    .isString()
    .withMessage("La contraseña es requerida")
    .isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),
  handleValidation,
];

//validador para POST /usuarios/recuperar-password
export const validarRecuperarPassword = [
  body("email")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email no es valido")
    .normalizeEmail(),
  handleValidation,
];

//validador para POST /usuarios/restablecer-password (el cliente manda el token plano del email)
export const validarRestablecerPassword = [
  body("token")
    .isString()
    .withMessage("El token es requerido")
    .isLength({ min: 16, max: 200 })
    .withMessage("El token no es valido"),
  body("password")
    .isString()
    .withMessage("La contraseña es requerida")
    .isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),
  handleValidation,
];

//validador para POST /usuarios/registro-inicial (endpoint publico para crear el primer admin de una empresa recien creada)
//el controller fuerza rol='admin' a fuego asi que aqui no valido el rol
export const validarRegistroInicial = [
  body("empresa_id")
    .exists({ checkNull: true })
    .withMessage("empresa_id es requerido")
    .isInt({ min: 1 })
    .withMessage("empresa_id debe ser un entero positivo"),
  body("nombre")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ max: LIMITES.NOMBRE_USUARIO_MAX })
    .withMessage(`El nombre no puede superar ${LIMITES.NOMBRE_USUARIO_MAX} caracteres`)
    .matches(REGEX_NOMBRE_PERSONA)
    .withMessage("El nombre solo puede contener letras, espacios, guiones o apostrofes"),
  body("email")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("El email no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .withMessage(`El email no puede superar ${LIMITES.EMAIL_MAX} caracteres`)
    .normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),
  handleValidation,
];

//validador para POST /usuarios (solo admin puede crear usuarios)
export const validarCrearUsuario = [
  body("empresa_id")
    .exists({ checkNull: true })
    .withMessage("empresa_id es requerido")
    .isInt({ min: 1 })
    .withMessage("empresa_id debe ser un entero positivo"),
  body("nombre")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ max: LIMITES.NOMBRE_USUARIO_MAX })
    .matches(REGEX_NOMBRE_PERSONA)
    .withMessage("El nombre solo puede contener letras, espacios, guiones o apostrofes"),
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("El email no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),
  body("rol")
    .isIn(ROLES)
    .withMessage(`El rol debe ser uno de: ${ROLES.join(", ")}`),
  handleValidation,
];

//validador para PUT /usuarios/:id (solo admin puede actualizar usuarios)
//en update la contraseña es OPCIONAL: si llega vacia o no llega, el controller mantiene la actual
//si llega tiene que ser >= 8; la regla de "password fuerte" (mayuscula + digito + simbolo) la valida el controller porque es politica de seguridad
export const validarActualizarUsuario = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  body("empresa_id")
    .exists({ checkNull: true })
    .withMessage("empresa_id es requerido")
    .isInt({ min: 1 })
    .withMessage("empresa_id debe ser un entero positivo"),
  body("nombre")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ max: LIMITES.NOMBRE_USUARIO_MAX })
    .matches(REGEX_NOMBRE_PERSONA)
    .withMessage("El nombre solo puede contener letras, espacios, guiones o apostrofes"),
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("El email no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .normalizeEmail(),
  body("rol")
    .isIn(ROLES)
    .withMessage(`El rol debe ser uno de: ${ROLES.join(", ")}`),
  //password opcional: si llega tiene que ser >= 8 caracteres
  body("password")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),
  handleValidation,
];

//validador comun para parametro :id en URL
export const validarIdParam = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  handleValidation,
];
