import { validationResult } from "express-validator";

//middleware comun que recoge los errores de express-validator y los devuelve al cliente
//lo monto al final de cada cadena de validacion
//si hay errores devuelve 400 con el primero en "message" y la lista completa en "errors"
//asi el frontend puede pintar "message" directamente (su handleError ya lee error.message)
export const handleValidation = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const lista = errores.array();
    return res.status(400).json({
      message: lista[0].msg,
      errors: lista,
    });
  }
  next();
};
