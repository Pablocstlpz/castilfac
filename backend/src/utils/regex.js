//regex y limites de longitud compartidos entre validators y controllers
//tengo una sola fuente de verdad para que las reglas no se vayan separando entre create/update
//el gemelo de este archivo en el frontend esta en frontend/src/app/shared/regex.ts
//si toco una regex, toco las dos para que no se descuadren

//regex para validar CIF de empresa (letra inicial + 7 digitos + digito o letra final)
//excluye las letras I, O, T porque la AEAT no las usa como inicial
export const REGEX_CIF = /^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/;

//regex para validar telefono internacional (formato E.164: sin + 7-15 digitos sin empezar por 0)
export const REGEX_TELEFONO = /^\+?[1-9]\d{6,14}$/;

//regex para validar codigo postal espanol (5 digitos)
export const REGEX_CODIGO_POSTAL = /^[0-9]{5}$/;

//regex para validar nombres de ciudad o provincia (acentos, espacios, guiones y apostrofes)
export const REGEX_NOMBRE_GEOGRAFICO = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

//regex para validar el nombre de una persona (igual que el geografico)
export const REGEX_NOMBRE_PERSONA = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/;

//regex permisivo para NIF/CIF de cliente (cubre DNI, NIE, CIF y VAT extranjero)
export const REGEX_NIF_CIF_PERMISIVO = /^[A-Za-z0-9]{8,12}$/;

//regex para password fuerte (minimo 8 caracteres, una mayuscula, un digito y un caracter especial)
export const REGEX_PASSWORD_FUERTE = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

//tipos de cliente permitidos, alineados con el ENUM del modelo Sequelize
export const TIPOS_CLIENTE = ["particular", "empresa", "vip", "mayorista"];

//limites de longitud para validators y controllers
//cada valor cuadra con la columna real de la BD para que el backend no rechaze inserts que MariaDB acepta
export const LIMITES = Object.freeze({
  EMAIL_MAX: 100,           //BD: varchar(100)
  NOMBRE_COMERCIAL_MAX: 200, //BD: varchar(200)
  RAZON_SOCIAL_MAX: 200,    //BD: varchar(200)
  DIRECCION_MAX: 500,       //BD: TEXT (lo limito por practica)
  CIUDAD_MAX: 100,          //BD: varchar(100)
  PROVINCIA_MAX: 100,       //BD: varchar(100)
  CODIGO_POSTAL_MAX: 10,    //BD: varchar(10)
  TELEFONO_MAX: 20,         //BD: varchar(20)
  NIF_MAX: 20,              //BD: varchar(20)
  NOMBRE_USUARIO_MAX: 100,  //BD: varchar(100)
  PASSWORD_MIN: 8,
  CLIENTE_NOMBRE_MAX: 150,  //BD: varchar(150)
});
