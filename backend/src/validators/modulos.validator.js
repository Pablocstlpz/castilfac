import { body, param, validationResult } from 'express-validator';

// Middleware reutilizable para manejar errores
const validationErrors = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            errors: errores.array()
        });
    }
    next();
};
// Validación de idCurso en parámetros de ruta
export const validarId = [
    param('id')
        .trim()
        .notEmpty().withMessage("El ID del módulo es requerido"),
        

    validationErrors
];

// Validación completa para POST y PUT
export const validar = [
    body('idModulo')
        .trim()
        .notEmpty().withMessage("El ID del módulo es requerido")
        .isLength({ max: 8 }).withMessage('El id del módulo no puede superar 8 caracteres')
        .matches(/^[A-Z]+$/).withMessage("El ID del módulo solo puede contener letras"),

    body('descripcion')
        .trim()
        .notEmpty().withMessage("La descripción del módulo es requerida")
        .isLength({ min: 5, max: 50 }).withMessage("La descripción debe tener entre 5 y 50 caracteres")
        .customSanitizer(value =>
            value.toLowerCase().split(' ').map(palabra => `${palabra.charAt(0).toUpperCase()} ${palabra.slice(1)}`)
        ),
    body('idCurso')
        
        .trim()
        .notEmpty().withMessage("El ID del curso no puede estar vacío si se proporciona")
        .isLength({ min: 3, max: 10 }).withMessage("El ID del curso debe tener entre 3 y 10 caracteres")
        .matches(/^[A-Z0-9]+$/).withMessage("El ID del curso solo puede contener letras mayúsculas y números"),
    
    validationErrors
];

// Validación parcial para PATCH (todos los campos opcionales)
export const validarPatch = [
    body('idModulo')
        .optional()
        .trim()
        .notEmpty().withMessage("El ID del curso es requerido")
        .isLength({ max: 8 }).withMessage('El id del módulo no puede superar 8 caracteres')
        .matches(/^[A-Z]+$/).withMessage("El ID del módulo solo puede contener letras"),

    body('descripcion')
        .optional()
        .trim()
        .notEmpty().withMessage("La descripción del módulo es requerida")
        .isLength({ min: 5, max: 50 }).withMessage("La descripción debe tener entre 5 y 50 caracteres")
        .customSanitizer(value =>
            value.toLowerCase().split(' ').map(palabra => `${palabra.charAt(0).toUpperCase()} ${palabra.slice(1)}`)
        ),
    body('idCurso')
        .optional()
        .trim()
        .notEmpty().withMessage("El ID del curso no puede estar vacío si se proporciona")
        .isLength({ min: 3, max: 10 }).withMessage("El ID del curso debe tener entre 3 y 10 caracteres")
        .matches(/^[A-Z0-9]+$/).withMessage("El ID del curso solo puede contener letras mayúsculas y números"),

    // Validar que al menos un campo sea proporcionado
    body()
        .custom((value, { req }) => {
            const fields = Object.keys(req.body);
            if (fields.length === 0) {
                throw new Error('Debe proporcionar al menos un campo para actualizar');
            }
            return true;
        }),

    validationErrors
];


