//logger minimo con redaccion automatica de campos sensibles
//asi me aseguro que un console.log accidental nunca imprime un password, hash o token en claro
//
//uso:
//   logger.info('contextoOFuncion', payload)
//   logger.warn('contextoOFuncion', payload)
//   logger.error('contextoOFuncion', payload)
//
//si en algun momento queremos centralizar los logs en pino o winston, solo hay que tocar este archivo

//lista de campos que NUNCA quiero que se impriman en los logs
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

//funcion recursiva que reemplaza los valores de los campos sensibles por [REDACTED]
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

//funcion que da formato a la linea del log con nivel + contexto + payload
const formato = (nivel, contexto, payload) => {
  //si el payload es un Error imprimo solo el message y el stack, no toda la instancia
  if (payload instanceof Error) {
    return [`[${nivel}][${contexto}]`, payload.message, payload.stack];
  }
  return [`[${nivel}][${contexto}]`, redactar(payload)];
};

//API publica del logger
export const logger = {
  info: (contexto, payload) => console.log(...formato("INFO", contexto, payload)),
  warn: (contexto, payload) => console.warn(...formato("WARN", contexto, payload)),
  error: (contexto, payload) => console.error(...formato("ERROR", contexto, payload)),
};
