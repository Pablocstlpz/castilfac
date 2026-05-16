import rateLimit from "express-rate-limit";

//Limitadores especificos para los endpoints sensibles.
//Convencion: clave por IP. Si vamos detras de un proxy (nginx/cloudflare), hay
//que activar 'trust proxy' en app.js para que la IP real llegue. Lo dejamos
//comentado y se documenta en solucion-auditoria.md cuando haga falta.

//---- Login / Google login --------------------------------------------------
//Mas estricto: 5 intentos por IP cada 15 minutos. Bloquea fuerza bruta basica
//sin afectar al usuario legitimo (que normalmente acierta a la 1-3).
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de inicio de sesion. Inténtalo en 15 minutos.",
  },
});

//---- Recuperacion / restablecimiento de password ---------------------------
//3 solicitudes / hora por IP. Evita spam de emails de recuperacion.
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Has solicitado restablecer la contraseña demasiadas veces. Inténtalo de nuevo en 1 hora.",
  },
});

//---- Registro / reenvio verificacion --------------------------------------
//3 por hora por IP. Reduce abuso de creacion de empresas y de envios de email
//de verificacion.
export const registroRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas peticiones de registro. Inténtalo en 1 hora.",
  },
});
