import { body, param } from "express-validator";

import {
  LIMITES,
  REGEX_NIF_CIF_PERMISIVO,
  REGEX_TELEFONO,
  TIPOS_CLIENTE,
} from "../utils/regex.js";
import { handleValidation } from "./_handle.js";

//Reglas comunes para crear/actualizar un cliente.
//El controller tambien tiene `validarPayloadCliente` como defensa en profundidad
//por si alguna ruta llama al handler sin pasar por esta cadena de validator.
const reglasComunes = (paraCrear) => [
  body("nombre_empresa_o_particular")
    [paraCrear ? "exists" : "optional"]({ checkFalsy: !paraCrear })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("El nombre del cliente es obligatorio")
    .isLength({ max: LIMITES.CLIENTE_NOMBRE_MAX })
    .withMessage(`El nombre no puede superar ${LIMITES.CLIENTE_NOMBRE_MAX} caracteres`),
  body("tipo_cliente")
    .optional({ checkFalsy: true })
    .isIn(TIPOS_CLIENTE)
    .withMessage(`tipo_cliente debe ser uno de: ${TIPOS_CLIENTE.join(", ")}`),
  body("email")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isEmail()
    .withMessage("El email no es valido")
    .isLength({ max: LIMITES.EMAIL_MAX })
    .normalizeEmail(),
  body("telefono")
    .optional({ checkFalsy: true })
    .isString()
    .matches(REGEX_TELEFONO)
    .withMessage("El telefono no es valido"),
  body("nif_cif")
    .optional({ checkFalsy: true })
    .isString()
    .matches(REGEX_NIF_CIF_PERMISIVO)
    .withMessage("El NIF/CIF no es valido"),
  body("descuento_fijo")
    .optional({ checkFalsy: false, nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("descuento_fijo debe estar entre 0 y 100"),
  body("direccion")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: LIMITES.DIRECCION_MAX })
    .withMessage(`La direccion no puede superar ${LIMITES.DIRECCION_MAX} caracteres`),
];

export const validarCrearCliente = [...reglasComunes(true), handleValidation];

export const validarActualizarCliente = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  ...reglasComunes(false),
  handleValidation,
];

export const validarIdParam = [
  param("id").isInt({ min: 1 }).withMessage("El id debe ser un entero positivo"),
  handleValidation,
];

export const validarEmpresaIdParam = [
  param("empresa_id").isInt({ min: 1 }).withMessage("empresa_id debe ser un entero positivo"),
  handleValidation,
];
