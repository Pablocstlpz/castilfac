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

// Validación completa para POST 
export const validar = [
    body('idCurso')
        .trim()
        .notEmpty().withMessage("El ID del curso es requerido"),
        

    body('idModulo')
        .trim()
        .notEmpty().withMessage("La descripción del módulo es requerida"),
        
    body('idAlumno')
        .trim()
        .notEmpty().withMessage("El ID es requerido"),
    
    validationErrors
];




