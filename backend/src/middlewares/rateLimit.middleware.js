import rateLimit from "express-rate-limit";

//limitadores de peticiones para los endpoints sensibles
//la clave es la IP del cliente. Si la API queda detras de un proxy (nginx, cloudflare)
//tengo que activar 'trust proxy' en app.js para que llegue la IP real, si no se cuenta todo
//contra la IP del proxy y se bloquea a todos los usuarios a la vez

//limitador para login y login con google -> 20 intentos cada 15 minutos por IP
//bloquea fuerza bruta basica sin afectar al usuario legitimo (que normalmente acierta a la primera)
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiados intentos de inicio de sesion. Inténtalo en 15 minutos.",
  },
});

//limitador para recuperacion y restablecimiento de password -> 3 solicitudes por hora por IP
//asi evito que alguien me llene de emails un buzon spameando "olvide mi contraseña"
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

//limitador para registro y reenvio de verificacion -> 5 por hora por IP
//evita el abuso de creacion de empresas y de envio masivo de emails de verificacion
export const registroRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas peticiones de registro. Inténtalo en 1 hora.",
  },
});
