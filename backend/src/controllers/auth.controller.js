import { OAuth2Client } from "google-auth-library";
import { Usuario } from "../models/usuario.model.js";
import { Empresa } from "../models/empresa.model.js";
import { GOOGLE_CLIENT_ID } from "../config.js";
import {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
} from "../middlewares/auth.middleware.js";
import { logger } from "../utils/logger.js";

//cliente de Google que verifica los id token que llegan del frontend
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

//funcion compartida que emite la pareja { accessToken, refreshToken } para un usuario ya validado
//la uso desde el login con google y desde el login tradicional con password
export const emitirTokens = (usuario) => {
  //payload minimo necesario para autorizar peticiones siguientes
  const payload = {
    id: usuario.id,
    rol: usuario.rol,
    empresa_id: usuario.empresa_id,
  };
  return {
    accessToken: generarAccessToken(payload),
    refreshToken: generarRefreshToken(payload),
  };
};

//funcion para iniciar sesion con google
export const loginGoogle = async (req, res) => {
  try {
    //recojo el credential que manda Google Identity Services desde el frontend
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "El token de Google es requerido" });
    }

    //verifico que el token sea autentico y pertenezca a nuestro CLIENT_ID
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Token de Google inválido o expirado" });
    }

    const emailGoogle = payload.email;

    //busco el usuario por el email que devuelve google
    const usuario = await Usuario.findOne({ where: { email: emailGoogle } });

    //si no esta registrado en nuestro sistema, no lo dejo entrar (tiene que registrarse manualmente primero)
    if (!usuario) {
      return res.status(404).json({
        message:
          "Este correo de Google no tiene una cuenta asociada en el sistema. Regístrate primero de forma manual.",
      });
    }

    //compruebo que la empresa del usuario tenga el email verificado
    const empresa = await Empresa.findByPk(usuario.empresa_id);

    if (!empresa || !empresa.email_verificado) {
      return res.status(403).json({
        message:
          "La empresa no ha verificado su correo electrónico. Revisa tu bandeja de entrada.",
      });
    }

    //compruebo que la suscripcion este activa o el trial siga vigente
    if (!empresa.suscripcion_activa) {
      const ahora = new Date();
      const fechaVencimiento = empresa.fecha_vencimiento
        ? new Date(empresa.fecha_vencimiento)
        : null;

      //si el trial ha vencido devuelvo 403 con el tipo SUSCRIPCION_REQUERIDA para que el frontend redirija al pago
      if (!fechaVencimiento || ahora > fechaVencimiento) {
        return res.status(403).json({
          message: "Suscripción requerida. Tu prueba gratuita ha finalizado.",
          tipo: "SUSCRIPCION_REQUERIDA",
        });
      }
    }

    //emito access + refresh token y devuelvo el usuario (el toJSON del modelo ya filtra password y reset_token)
    const tokens = emitirTokens(usuario);
    res.status(200).json({ ...tokens, usuario });
  } catch (error) {
    logger.error("loginGoogle", error);
    res.status(500).json({ message: "Error al procesar el login con Google" });
  }
};

//funcion para POST /api/auth/refresh
//el frontend manda el refreshToken y recibe una nueva pareja { accessToken, refreshToken }
//roto tambien el refresh para detectar si alguien usa uno antiguo (asi el legitimo invalida al robado)
//
//implementacion stateless (no guardo nada en BD). Para revocar tokens en caliente haria falta una tabla
//de "refresh emitidos" con un id por token y un campo invalidado_en; lo dejo como deuda razonable
export const refrescarToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken requerido" });
    }

    //verifico la firma del refresh; si esta caducado o invalido respondo 401
    let payload;
    try {
      payload = verificarRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Refresh token invalido o expirado" });
    }

    //releo el usuario por id para confirmar que sigue existiendo y que su rol/empresa no han cambiado
    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    //compruebo que la empresa siga activa (no borrada)
    //no exijo suscripcion activa aqui: el refresh solo extiende sesion, el control de suscripcion va en cada ruta operativa
    const empresa = await Empresa.findByPk(usuario.empresa_id);
    if (!empresa || empresa.activo === false) {
      return res.status(401).json({ message: "Empresa no disponible" });
    }

    //emito nueva pareja de tokens
    const tokens = emitirTokens(usuario);
    res.status(200).json(tokens);
  } catch (error) {
    logger.error("refrescarToken", error);
    res.status(500).json({ message: "Error al refrescar el token" });
  }
};
