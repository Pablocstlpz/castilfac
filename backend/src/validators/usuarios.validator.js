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
// Validación de ID en parámetros de ruta
export const validarId = [
    param('id')
        .notEmpty().withMessage("El ID es requerido")
        .isMongoId().withMessage("El ID debe ser un ObjectId válido de MongoDB"),


    validationErrors //No lleva paréntesis porque Express necesita la función en sí, no el resultado de ejecutarla. Express la ejecutará más tarde cuando llegue una petición.
];
// Validación para REGISTRO (POST /PUT)
export const validarRegistro = [
    body('name')
        .trim()
        .notEmpty().withMessage("El nombre es requerido")
        .isLength({ min: 3, max: 100 }).withMessage("El nombre debe tener entre 3 y 100 caracteres")
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage("El nombre solo puede contener letras y espacios")
        .customSanitizer(value => value.replace(/\s+/g, ' ').trim()),
    body('email')
        .trim()
        .notEmpty().withMessage("El email es requerido")
        .isEmail().withMessage("Debe proporcionar un email válido")
        .isLength({ max: 150 }).withMessage("El email no puede exceder 150 caracteres")
        .normalizeEmail(),
     body('password')
        .notEmpty().withMessage("La contraseña es requerida")
        .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
       
    body('role')
        .optional()
        .isIn(['Admin', 'Usuario', 'Editor', 'Visor'])
        .withMessage("El rol debe ser: Admin, Usuario, Editor o Visor"),

    body('active')
        .optional()
        .isBoolean().withMessage("El campo active debe ser un valor booleano"),

    validationErrors
];

// Validación para LOGIN (POST /login o POST /auth/login)
export const validarLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage("El email es requerido")
        .isEmail().withMessage("Debe proporcionar un email válido")
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage("La contraseña es requerida"),
    
    validationErrors
];

