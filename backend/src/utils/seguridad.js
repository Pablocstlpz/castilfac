import bcrypt from "bcrypt";
import { createHash, randomBytes, randomUUID } from "crypto";

//factor de coste de bcrypt para todas las contraseñas de la aplicacion
//uso 12 porque tarda unos 250ms en hardware moderno, mucho mas seguro que 10 frente a ataques offline
//como el endpoint de login tiene rate-limit, el coste extra no afecta a usuarios legitimos
//bcrypt.compare lee el coste del hash existente, asi las passwords antiguas con factor 10 siguen funcionando
export const BCRYPT_ROUNDS = 12;

//funcion para hashear una contraseña con el factor centralizado
//asi no hay numeros magicos repetidos por los controllers
export const hashPassword = (passwordPlana) =>
  bcrypt.hash(passwordPlana, BCRYPT_ROUNDS);

//TOKENS INTERNOS (reset_token y token_verificacion)
//
//antes guardaba el token en claro en la BD; si se filtraba podian usarlo directamente
//ahora el cliente recibe el token plano por email pero en BD solo se guarda su sha256
//sha256 es determinista y rapido, no hace falta salt porque los tokens son aleatorios largos
//
//importante: este cambio invalida los tokens antiguos que hubiera en la BD
//los reset_token caducan en 1 hora igualmente, y los token_verificacion se pueden regenerar

//funcion para hashear un token con sha256 antes de guardarlo en BD
export const hashToken = (tokenPlano) =>
  createHash("sha256").update(String(tokenPlano)).digest("hex");

//funcion para generar un token de reset de password (64 chars hex = 256 bits)
//devuelve { plano, hash } - el plano va por email, el hash se guarda en BD
export const generarTokenReset = () => {
  const plano = randomBytes(32).toString("hex");
  return { plano, hash: hashToken(plano) };
};

//funcion para generar un token de verificacion de email (UUID v4)
//uso UUID porque es mas corto y queda mejor en la URL del email de verificacion
export const generarTokenVerificacion = () => {
  const plano = randomUUID();
  return { plano, hash: hashToken(plano) };
};
