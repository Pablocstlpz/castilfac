//Todo lo relativo al JWT

import jwt from 'jsonwebtoken';
import { SECRET_KEY, REFRESH_SECRET_KEY } from '../config.js';

// Tiempo de expiración de tokens
export const ACCESS_TOKEN_EXPIRY = '15m';  // 5-15 minutos
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


// Verificar token
export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader){
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  const token =  authHeader.split(" ")[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, usuario) => {

    if (err) {
      return res.status(403).json({ message: "Token invalido o expirado" });
    }
    req.user = usuario; //contiene el contenido del payload
    console.log(usuario);
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
export const autorizarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    
    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permiso para acceder a esta ruta" });
    }
    next();
  }
}