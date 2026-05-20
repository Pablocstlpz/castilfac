// Regex y limites compartidos para validar formularios reactivos.
//
// IMPORTANTE: gemelo de backend/src/utils/regex.js. Si tocas uno, toca el otro.
// Mantener una sola fuente de verdad evita que el front acepte algo que el back
// rechaza (ej. registro: el FE aceptaba DNI y el BE solo CIF).

// CIF de empresa: letra inicial valida + 7 digitos + digito/letra final
export const REGEX_CIF = /^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/;

// Telefono E.164 simplificado: opcional +, primer digito 1-9, 7-15 digitos
export const REGEX_TELEFONO = /^\+?[1-9]\d{6,14}$/;

// Codigo postal espanol (5 digitos)
export const REGEX_CODIGO_POSTAL = /^[0-9]{5}$/;

// Texto con caracteres del castellano (ciudad, provincia)
export const REGEX_NOMBRE_GEOGRAFICO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

// Nombre de persona
export const REGEX_NOMBRE_PERSONA = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

// NIF/CIF permisivo para CLIENTES (DNI/NIE/CIF/VAT extranjero)
export const REGEX_NIF_CIF_PERMISIVO = /^[A-Za-z0-9]{8,12}$/;

// Password fuerte: minimo 8 caracteres, 1 mayuscula, 1 digito y 1 caracter especial
// Gemelo de REGEX_PASSWORD_FUERTE en backend/src/utils/regex.js
export const REGEX_PASSWORD_FUERTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// Tipos de cliente alineados con el ENUM del modelo
export const TIPOS_CLIENTE = ["particular", "empresa", "vip", "mayorista"] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

// Limites de longitud. Cada uno cuadra con la columna real de la BD para
// que el frontend rechace antes lo que MariaDB rechazaria despues.
export const LIMITES = {
  EMAIL_MAX: 100,          // BD: varchar(100)
  NOMBRE_COMERCIAL_MAX: 200,
  RAZON_SOCIAL_MAX: 200,
  DIRECCION_MAX: 500,
  CIUDAD_MAX: 100,
  PROVINCIA_MAX: 100,
  CODIGO_POSTAL_MAX: 5,
  TELEFONO_MAX: 20,
  NIF_MAX: 9,
  NOMBRE_USUARIO_MAX: 100, // BD: varchar(100)
  PASSWORD_MIN: 8,
  CLIENTE_NOMBRE_MAX: 150, // BD: varchar(150)
} as const;
