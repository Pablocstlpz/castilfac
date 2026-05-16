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

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

//-------------------------------------------------------------------------
// Helper compartido: emite la pareja { accessToken, refreshToken } para un
// usuario ya verificado contra empresa + suscripcion. Se usa desde loginGoogle
// y desde el flujo nativo de password (getUsuarioCorreoContraseña).
//-------------------------------------------------------------------------
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

export const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "El token de Google es requerido" });
    }

    // Verificar que el token es auténtico y pertenece a nuestro CLIENT_ID
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

    // Buscar el usuario por email en nuestra base de datos
    const usuario = await Usuario.findOne({ where: { email: emailGoogle } });

    if (!usuario) {
      return res.status(404).json({
        message:
          "Este correo de Google no tiene una cuenta asociada en el sistema. Regístrate primero de forma manual.",
      });
    }

    // Verificar que la empresa tiene el email verificado y la suscripción válida
    const empresa = await Empresa.findByPk(usuario.empresa_id);

    if (!empresa || !empresa.email_verificado) {
      return res.status(403).json({
        message:
          "La empresa no ha verificado su correo electrónico. Revisa tu bandeja de entrada.",
      });
    }

    // Comprobar suscripción (misma lógica que checkSuscripcion)
    if (!empresa.suscripcion_activa) {
      const ahora = new Date();
      const fechaVencimiento = empresa.fecha_vencimiento
        ? new Date(empresa.fecha_vencimiento)
        : null;

      if (!fechaVencimiento || ahora > fechaVencimiento) {
        return res.status(403).json({
          message: "Suscripción requerida. Tu prueba gratuita ha finalizado.",
          tipo: "SUSCRIPCION_REQUERIDA",
        });
      }
    }

    //emito access + refresh token (el toJSON del modelo filtra password / reset_token)
    const tokens = emitirTokens(usuario);
    res.status(200).json({ ...tokens, usuario });
  } catch (error) {
    logger.error("loginGoogle", error);
    res.status(500).json({ message: "Error al procesar el login con Google" });
  }
};

//-------------------------------------------------------------------------
// POST /api/auth/refresh
//-------------------------------------------------------------------------
//El frontend envia el refreshToken en el body y recibe un nuevo access token
//(y opcionalmente rotamos el refresh para detectar reuso). Si el refresh es
//invalido o el usuario ya no existe -> 401 y el interceptor cerrara sesion.
//
//Esta es una implementacion stateless (no se guarda nada en BD). Para hacerla
//revocable haria falta una tabla de "tokens emitidos" con un id por token y
//un campo `invalidado_en`. Lo dejamos como deuda razonable.
export const refrescarToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken requerido" });
    }

    let payload;
    try {
      payload = verificarRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Refresh token invalido o expirado" });
    }

    //Releemos el usuario por id para confirmar que sigue existiendo y que su
    //rol/empresa no han cambiado desde que se emitio el refresh.
    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    //Comprobamos que la empresa sigue activa (no borrada). No exigimos
    //suscripcion activa aqui: el refresh es solo "extender sesion"; el control
    //de suscripcion lo hace checkSuscripcion en cada ruta operativa.
    const empresa = await Empresa.findByPk(usuario.empresa_id);
    if (!empresa || empresa.activo === false) {
      return res.status(401).json({ message: "Empresa no disponible" });
    }

    //Emitimos nueva pareja. La rotacion del refresh es opcional pero recomendada:
    //asi un refresh robado caduca cuando el usuario legitimo refresca.
    const tokens = emitirTokens(usuario);
    res.status(200).json(tokens);
  } catch (error) {
    logger.error("refrescarToken", error);
    res.status(500).json({ message: "Error al refrescar el token" });
  }
};
