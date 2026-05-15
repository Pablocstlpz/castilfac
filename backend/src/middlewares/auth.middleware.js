//Todo lo relativo al JWT

import jwt from 'jsonwebtoken';
import { SECRET_KEY, REFRESH_SECRET_KEY } from '../config.js';

// Tiempo de expiración de tokens
//8h cubre una jornada de trabajo completa sin requerir refresh todavia (Bloque 1)
export const ACCESS_TOKEN_EXPIRY = '8h';
export const REFRESH_TOKEN_EXPIRY = '7d';  // 7 días

// Generar Access Token
export const generarAccessToken = (payload) => {
    return jwt.sign(
        payload,
        SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
};

// Generar Refresh Token
export const generarRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        REFRESH_SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};


// Verificar token (Authorization: Bearer <token>)
export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  //la cabecera tiene el formato "Bearer <token>" => lo partimos y nos quedamos con el token
  const partes = authHeader.split(" ");
  const token = partes.length === 2 && partes[0] === "Bearer" ? partes[1] : null;

  if (!token) {
    return res.status(401).json({ message: "Token mal formado" });
  }

  jwt.verify(token, SECRET_KEY, (err, usuario) => {
    if (err) {
      //token expirado o invalido -> 401 para que el front pueda cerrar sesion
      return res.status(401).json({ message: "Token invalido o expirado" });
    }
    //inyectamos el payload (id, rol, empresa_id) en req.user para los siguientes middlewares
    req.user = usuario;
    next();
  });
};


export const verificarRefreshToken = (token) => {
    try {
        // Verifica el token usando la clave secreta del refresh token
        const payload = jwt.verify(token, REFRESH_SECRET_KEY);
        return payload;
    } catch (error) {
        throw new Error('Refresh token inválido o expirado');
    }
};

//averiguar si está autorizado según el rol
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
