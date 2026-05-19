import { body, param } from "express-validator";

import {
  LIMITES,
  REGEX_CIF,
  REGEX_CODIGO_POSTAL,
  REGEX_NOMBRE_GEOGRAFICO,
  REGEX_TELEFONO,
} from "../utils/regex.js";
import { handleValidation } from "./_handle.js";

//sanitizador que deja el NIF en mayusculas y sin espacios
//la regex de CIF asume mayusculas, asi me ahorro problemas si el usuario lo manda en minusculas
const sanitizarNif = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

//reglas comunes para crear o actualizar una empresa
//NO incluyo aqui suscripcion_activa, fecha_vencimiento, activo, email_verificado ni token_verificacion
//porque el controller los ignora a proposito (whitelist), los gestiona el servidor (Stripe / verificacion / superadmin)
const reglasComunesEmpresa = [
  body("nombre_comercial")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El nombre comercial es requerido")
    .isLength({ max: LIMITES.NOMBRE_COMERCIAL_MAX })
    .withMessage(`El nombre comercial no puede superar ${LIMITES.NOMBRE_COMERCIAL_MAX} caracteres`),
  body("razon_social")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("La razon social es requerida")
    .isLength({ max: LIMITES.RAZON_SOCIAL_MAX })
    .withMessage(`La razon social no puede superar ${LIMITES.RAZON_SOCIAL_MAX} caracteres`),
  body("nif")
    .isString()
    .customSanitizer(sanitizarNif)
    .matches(REGEX_CIF)
    .withMessage("El CIF no es valido"),
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("El email no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .normalizeEmail(),
  body("telefono")
    .isString()
    .trim()
    .matches(REGEX_TELEFONO)
    .withMessage("El telefono no es valido"),
  body("direccion")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("La direccion es requerida")
    .isLength({ max: LIMITES.DIRECCION_MAX })
    .withMessage(`La direccion no puede superar ${LIMITES.DIRECCION_MAX} caracteres`),
  body("codigo_postal")
    .isString()
    .matches(REGEX_CODIGO_POSTAL)
    .withMessage("El codigo postal no es valido (5 digitos)"),
  body("ciudad")
    .isString()
    .trim()
    .matches(REGEX_NOMBRE_GEOGRAFICO)
    .withMessage("La ciudad solo puede contener letras y espacios")
    .isLength({ max: LIMITES.CIUDAD_MAX })
    .withMessage(`La ciudad no puede superar ${LIMITES.CIUDAD_MAX} caracteres`),
  body("provincia")
    .isString()
    .trim()
    .matches(REGEX_NOMBRE_GEOGRAFICO)
    .withMessage("La provincia solo puede contener letras y espacios")
    .isLength({ max: LIMITES.PROVINCIA_MAX })
    .withMessage(`La provincia no puede superar ${LIMITES.PROVINCIA_MAX} caracteres`),
  body("logo_url")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("El logo_url no puede superar 500 caracteres"),
];

//validador para POST /empresas (creacion publica de empresa)
export const validarCrearEmpresa = [...reglasComunesEmpresa, handleValidation];

//validador para PUT /empresas/:id (actualizacion de empresa)
export const validarActualizarEmpresa = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  ...reglasComunesEmpresa,
  handleValidation,
];

//validador para POST /empresas/reenviar-verificacion
export const validarReenviarVerificacion = [
  body("email").isString().trim().isEmail().withMessage("El email no es valido").normalizeEmail(),
  handleValidation,
];

//validador para GET /empresas/verificar/:token (link del email de verificacion)
export const validarVerificarToken = [
  param("token").isString().isLength({ min: 16, max: 100 }).withMessage("Token no valido"),
  handleValidation,
];

//validador para GET /empresas/nif/:nif (busqueda publica por NIF durante el registro)
export const validarNifParam = [
  param("nif").isString().customSanitizer(sanitizarNif).matches(REGEX_CIF).withMessage("El CIF no es valido"),
  handleValidation,
];

//validador comun para parametro :id en URL
export const validarIdParam = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  handleValidation,
];

//validador para POST /empresas/registro (endpoint transaccional que crea empresa + admin en una sola peticion)
//anida los checks de empresa bajo "empresa.*" y los del admin bajo "admin.*"
export const validarRegistroTransaccional = [
  //--- empresa ---
  body("empresa.nombre_comercial")
    .isString().trim().notEmpty().withMessage("El nombre comercial es requerido")
    .isLength({ max: LIMITES.NOMBRE_COMERCIAL_MAX }),
  body("empresa.razon_social")
    .isString().trim().notEmpty().withMessage("La razon social es requerida")
    .isLength({ max: LIMITES.RAZON_SOCIAL_MAX }),
  body("empresa.nif")
    .isString().customSanitizer(sanitizarNif).matches(REGEX_CIF).withMessage("El CIF no es valido"),
  body("empresa.email")
    .isString().trim().isEmail().withMessage("El email de empresa no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX }).normalizeEmail(),
  body("empresa.telefono")
    .isString().trim().matches(REGEX_TELEFONO).withMessage("El telefono no es valido"),
  body("empresa.direccion")
    .isString().trim().notEmpty().withMessage("La direccion es requerida")
    .isLength({ max: LIMITES.DIRECCION_MAX }),
  body("empresa.codigo_postal")
    .isString().matches(REGEX_CODIGO_POSTAL).withMessage("El codigo postal no es valido"),
  body("empresa.ciudad")
    .isString().trim().matches(REGEX_NOMBRE_GEOGRAFICO).withMessage("La ciudad no es valida")
    .isLength({ max: LIMITES.CIUDAD_MAX }),
  body("empresa.provincia")
    .isString().trim().matches(REGEX_NOMBRE_GEOGRAFICO).withMessage("La provincia no es valida")
    .isLength({ max: LIMITES.PROVINCIA_MAX }),
  body("empresa.logo_url").optional({ checkFalsy: true }).isString().isLength({ max: 500 }),

  //--- admin ---
  body("admin.nombre")
    .isString().trim().notEmpty().withMessage("El nombre del administrador es requerido")
    .isLength({ max: LIMITES.NOMBRE_USUARIO_MAX }),
  body("admin.email")
    .isString().trim().isEmail().withMessage("El email del administrador no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX }).normalizeEmail(),
  body("admin.password")
    .isString().isLength({ min: LIMITES.PASSWORD_MIN })
    .withMessage(`La contraseña debe tener al menos ${LIMITES.PASSWORD_MIN} caracteres`),

  handleValidation,
];
