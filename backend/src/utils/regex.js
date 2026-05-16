//Regex y limites compartidos entre validators y controllers.
//Mantener UNA sola fuente de verdad para evitar reglas dispares entre create/update.
//
//IMPORTANTE: estos mismos patrones tienen su gemelo en
//frontend/src/app/shared/regex.ts. Si tocas uno, toca tambien el otro.

//CIF de empresa: letra inicial + 7 digitos + digito/letra final.
//Excluye letras reservadas (I, O, T) segun normativa AEAT.
export const REGEX_CIF = /^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/;

//Telefono internacional E.164 (sin +: 7-15 digitos sin empezar por 0)
export const REGEX_TELEFONO = /^\+?[1-9]\d{6,14}$/;

//Codigo postal espanol: 5 digitos
export const REGEX_CODIGO_POSTAL = /^[0-9]{5}$/;

//Texto con caracteres del castellano (nombres de ciudad, provincia, etc.)
export const REGEX_NOMBRE_GEOGRAFICO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

//Nombre de persona (admite acentos, espacios, guiones, apostrofes)
export const REGEX_NOMBRE_PERSONA = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

//NIF/CIF permisivo (cubre DNI, NIE, CIF, VAT extranjero): 8-12 alfanumericos
export const REGEX_NIF_CIF_PERMISIVO = /^[A-Za-z0-9]{8,12}$/;

//Password fuerte: minimo 8, al menos una mayuscula, un digito y un caracter especial
export const REGEX_PASSWORD_FUERTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

//Tipos de cliente validos (alineado con el ENUM del modelo Sequelize)
export const TIPOS_CLIENTE = ["particular", "empresa", "vip", "mayorista"];

//Limites de longitud usados en validators y controllers.
//IMPORTANTE: cada valor cuadra con la columna VARCHAR / TEXT real de la BD.
//Si BD limita 100 y aqui pones 200, MariaDB trunca o rechaza el INSERT.
export const LIMITES = Object.freeze({
  EMAIL_MAX: 100,           // BD: varchar(100)
  NOMBRE_COMERCIAL_MAX: 200, // BD: varchar(200)
  RAZON_SOCIAL_MAX: 200,    // BD: varchar(200)
  DIRECCION_MAX: 500,       // BD: TEXT (limitado por practica)
  CIUDAD_MAX: 100,          // BD: varchar(100)
  PROVINCIA_MAX: 100,       // BD: varchar(100)
  CODIGO_POSTAL_MAX: 10,    // BD: varchar(10)
  TELEFONO_MAX: 20,         // BD: varchar(20)
  NIF_MAX: 20,              // BD: varchar(20)
  NOMBRE_USUARIO_MAX: 100,  // BD: varchar(100) (antes 200, rompia inserts)
  PASSWORD_MIN: 8,
  CLIENTE_NOMBRE_MAX: 150,  // BD: varchar(150) (antes 255, rompia inserts)
});
