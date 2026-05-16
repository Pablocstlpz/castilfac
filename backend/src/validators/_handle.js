import { validationResult } from "express-validator";

//Middleware comun que junta los errores de express-validator y, si hay alguno,
//responde 400 con la lista. Se enchufa al final de cada cadena de validacion.
export const handleValidation = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    //Devolvemos solo el primer mensaje en `message` para que el frontend pueda
    //pintarlo directo (asi no rompemos el handleError del frontend que lee error.message),
    //y la lista completa en `errors` por si queremos UX mas detallada en el futuro.
    const lista = errores.array();
    return res.status(400).json({
      message: lista[0].msg,
      errors: lista,
    });
  }
  next();
};
