//Logger minimal con redaccion de campos sensibles para evitar que un
//console.log accidental imprima password / token / hash a los logs.
//
//Sustituye al patron repetido por todo el codigo:
//   console.log(error);     -> logger.error('contexto', error);
//   console.log(usuario);   -> logger.info('contexto', usuario);
//Y NUNCA filtra password, hash, reset_token, token_verificacion, accessToken,
//refreshToken o credential.

const CAMPOS_SENSIBLES = new Set([
  "password",
  "passwordPlana",
  "hash",
  "hashedPassword",
  "reset_token",
  "reset_token_expira",
  "token_verificacion",
  "accessToken",
  "refreshToken",
  "credential",
  "authorization",
]);

const redactar = (valor) => {
  if (valor == null) return valor;
  if (Array.isArray(valor)) return valor.map(redactar);
  if (typeof valor !== "object") return valor;
  const salida = {};
  for (const [clave, val] of Object.entries(valor)) {
    if (CAMPOS_SENSIBLES.has(clave)) {
      salida[clave] = "[REDACTED]";
    } else {
      salida[clave] = redactar(val);
    }
  }
  return salida;
};

const formato = (nivel, contexto, payload) => {
  //payload puede ser un Error: imprimimos message+stack pero NO toda la instancia.
  if (payload instanceof Error) {
    return [`[${nivel}][${contexto}]`, payload.message, payload.stack];
  }
  return [`[${nivel}][${contexto}]`, redactar(payload)];
};

export const logger = {
  info: (contexto, payload) => console.log(...formato("INFO", contexto, payload)),
  warn: (contexto, payload) => console.warn(...formato("WARN", contexto, payload)),
  error: (contexto, payload) => console.error(...formato("ERROR", contexto, payload)),
};
