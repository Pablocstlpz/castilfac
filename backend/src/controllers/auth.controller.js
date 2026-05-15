import { OAuth2Client } from "google-auth-library";
import { Usuario } from "../models/usuario.model.js";
import { Empresa } from "../models/empresa.model.js";
import { GOOGLE_CLIENT_ID } from "../config.js";
import { generarAccessToken } from "../middlewares/auth.middleware.js";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

    //genero un access token JWT igual que en el login tradicional
    const accessToken = generarAccessToken({
      id: usuario.id,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id,
    });

    //devuelvo el token y el usuario (el toJSON del modelo ya filtra password / reset_token)
    res.status(200).json({ accessToken, usuario });
  } catch (error) {
    console.error("[loginGoogle] error:", error);
    res.status(500).json({ message: "Error al procesar el login con Google" });
  }
};
