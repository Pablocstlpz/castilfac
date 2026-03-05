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
        .notEmpty().withMessage("El ID del curso es requerido")
        .matches(/^[A-Za-z0-9]+$/).withMessage("El ID del curso solo puede contener letras y números"),
    
    validationErrors
];

// Validación completa para POST y PUT
export const validar = [
    body('idCurso')
        .trim()
        .notEmpty().withMessage("El ID del curso es requerido")
        .isLength({ min: 3, max: 10 }).withMessage("El ID del curso debe tener entre 3 y 10 caracteres")
        .matches(/^[A-Z0-9]+$/).withMessage("El ID del curso solo puede contener letras mayúsculas y números"),
    
    body('descripcion')
        .trim()
        .notEmpty().withMessage("La descripción del curso es requerida")
        .isLength({ min: 5, max: 50 }).withMessage("La descripción debe tener entre 5 y 50 caracteres")
        .customSanitizer (value=> 
            value.toLowerCase().split(' ').map(palabra => `${palabra.charAt(0).toUpperCase()}${palabra.slice(1)}`).join(' ')
        ),
    
    validationErrors
];

// Validación parcial para PATCH (todos los campos opcionales)
export const validarPatch = [
    body('idCurso')
        .optional()
        .trim()
        .notEmpty().withMessage("El ID del curso no puede estar vacío si se proporciona")
        .isLength({ min: 3, max: 10 }).withMessage("El ID del curso debe tener entre 3 y 10 caracteres")
        .matches(/^[A-Z0-9]+$/).withMessage("El ID del curso solo puede contener letras mayúsculas y números"),
    
    body('descripcion')
        .optional()
        .trim()
        .notEmpty().withMessage("La descripción no puede estar vacía si se proporciona")
        .isLength({ min: 5, max: 50 }).withMessage("La descripción debe tener entre 5 y 50 caracteres"),
    
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
  

