//todo lo relativo al JWT (generar access y refresh, validar el token en peticiones, y autorizar por rol)

import jwt from 'jsonwebtoken';
import { SECRET_KEY, REFRESH_SECRET_KEY } from '../config.js';

//tiempo de vida del access token (15 min, el corto)
//como hay refresh flow, si alguien roba el access su ventana de uso es pequeña
export const ACCESS_TOKEN_EXPIRY = '15m';
//tiempo de vida del refresh token (7 dias, el largo)
export const REFRESH_TOKEN_EXPIRY = '7d';

//funcion para generar el access token con el payload del usuario
export const generarAccessToken = (payload) => {
    return jwt.sign(
        payload,
        SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

//funcion para generar el refresh token con el payload del usuario
//uso una secret distinta a la del access para que si se filtra una no caigan las dos
export const generarRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        REFRESH_SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};


//middleware que valida el access token de la cabecera Authorization: Bearer <token>
export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  //la cabecera tiene formato "Bearer <token>", la parto y me quedo con el token
  const partes = authHeader.split(" ");
  const token = partes.length === 2 && partes[0] === "Bearer" ? partes[1] : null;

  if (!token) {
    return res.status(401).json({ message: "Token mal formado" });
  }

  jwt.verify(token, SECRET_KEY, (err, usuario) => {
    if (err) {
      //token caducado o invalido -> 401 para que el frontend pida refresh o cierre sesion
      return res.status(401).json({ message: "Token invalido o expirado" });
    }
    //meto el payload del token (id, rol, empresa_id) en req.user para los siguientes middlewares
    req.user = usuario;
    next();
  });
};


//funcion para verificar un refresh token (la usa el endpoint POST /auth/refresh)
export const verificarRefreshToken = (token) => {
    try {
        //verifico la firma usando la secret del refresh, devuelvo el payload
        const payload = jwt.verify(token, REFRESH_SECRET_KEY);
        return payload;
    } catch (error) {
        throw new Error('Refresh token inválido o expirado');
    }
};

//middleware que autoriza por rol (lo monto despues de autenticarToken en las rutas)
//acepta tanto array como string -> autorizarRol('admin') o autorizarRol(['admin','superadmin'])
export const autorizarRol = (rolesPermitidos) => {
  const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tienes permiso para acceder a esta ruta" });
    }
    next();
  };
};
