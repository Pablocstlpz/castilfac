import { body, param } from "express-validator";

import { handleValidation } from "./_handle.js";

//tipos de unidad permitidos en el ENUM de la BD
//(SIN "litros": el ENUM de MariaDB no lo tiene)
const TIPOS_UNIDAD = [
  "metros_lineales",
  "metros_cuadrados",
  "unidades",
  "kilogramos",
];

//limites alineados con la BD (varchar de cada columna)
const MAX_NOMBRE = 200;
const MAX_CODIGO_INTERNO = 50;
const MAX_PROVEEDOR = 150;
const MAX_REFERENCIA_PROVEEDOR = 100;
const MAX_IMAGEN_URL = 500;
//tope sensato de precio para evitar que alguien meta numeros gigantes
const MAX_PRECIO = 1_000_000;

//reglas comunes para crear y actualizar un material
//paraCrear=true marca como required los campos imprescindibles
const reglasComunes = (paraCrear) => [
  body("nombre")
    [paraCrear ? "exists" : "optional"]({ checkFalsy: !paraCrear })
    .isString().withMessage("El nombre debe ser texto")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio")
    .isLength({ max: MAX_NOMBRE })
    .withMessage(`El nombre no puede superar ${MAX_NOMBRE} caracteres`),

  body("categoria_id")
    [paraCrear ? "exists" : "optional"]({ checkNull: true })
    .isInt({ min: 1 })
    .withMessage("categoria_id debe ser un entero positivo"),

  body("tipo_unidad")
    [paraCrear ? "exists" : "optional"]({ checkFalsy: !paraCrear })
    .isIn(TIPOS_UNIDAD)
    .withMessage(`tipo_unidad debe ser uno de: ${TIPOS_UNIDAD.join(", ")}`),

  body("precio_base")
    [paraCrear ? "exists" : "optional"]({ checkNull: true })
    .isFloat({ min: 0, max: MAX_PRECIO })
    .withMessage(`precio_base debe ser un numero entre 0 y ${MAX_PRECIO}`),

  body("porcentaje_merma_recomendado")
    .optional({ checkFalsy: false, nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("porcentaje_merma_recomendado debe estar entre 0 y 100"),

  body("codigo_interno")
    .optional({ checkFalsy: true })
    .isString().trim()
    .isLength({ max: MAX_CODIGO_INTERNO })
    .withMessage(`codigo_interno no puede superar ${MAX_CODIGO_INTERNO} caracteres`),

  body("descripcion")
    .optional({ checkFalsy: true })
    .isString(),

  body("proveedor")
    .optional({ checkFalsy: true })
    .isString().trim()
    .isLength({ max: MAX_PROVEEDOR })
    .withMessage(`proveedor no puede superar ${MAX_PROVEEDOR} caracteres`),

  body("referencia_proveedor")
    .optional({ checkFalsy: true })
    .isString().trim()
    .isLength({ max: MAX_REFERENCIA_PROVEEDOR })
    .withMessage(`referencia_proveedor no puede superar ${MAX_REFERENCIA_PROVEEDOR} caracteres`),

  body("imagen_url")
    .optional({ checkFalsy: true })
    .isString().trim()
    .isLength({ max: MAX_IMAGEN_URL })
    .withMessage(`imagen_url no puede superar ${MAX_IMAGEN_URL} caracteres`),

  body("activo")
    .optional({ checkFalsy: false, nullable: true })
    .isBoolean()
    .withMessage("activo debe ser true o false"),
];

export const validarCrearMaterial = [
  param("empresa_id").isInt({ min: 1 }).withMessage("empresa_id debe ser un entero positivo"),
  ...reglasComunes(true),
  handleValidation,
];

export const validarActualizarMaterial = [
  param("empresa_id").isInt({ min: 1 }).withMessage("empresa_id debe ser un entero positivo"),
  param("id").isInt({ min: 1 }).withMessage("id debe ser un entero positivo"),
  ...reglasComunes(false),
  handleValidation,
];

export const validarIdParam = [
  param("empresa_id").isInt({ min: 1 }).withMessage("empresa_id debe ser un entero positivo"),
  param("id").isInt({ min: 1 }).withMessage("id debe ser un entero positivo"),
  handleValidation,
];

export const validarEmpresaIdParam = [
  param("empresa_id").isInt({ min: 1 }).withMessage("empresa_id debe ser un entero positivo"),
  handleValidation,
];
