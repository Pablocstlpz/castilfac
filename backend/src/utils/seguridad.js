import bcrypt from "bcrypt";
import { createHash, randomBytes, randomUUID } from "crypto";

//Factor de coste de bcrypt usado en TODA la aplicacion (hash de password).
//
//12 vs 10: con 12 cada hash tarda ~250 ms en hardware moderno (vs ~80 ms con 10).
//Como el endpoint de login tiene rate-limit (5 / 15 min por IP) y aqui hay
//pocas operaciones de creacion de usuario, el coste extra es asumible y
//endurece muchisimo el ataque offline si llegara a filtrarse la BD.
//
//NOTA sobre compatibilidad: bcrypt.compare lee el coste de cada hash existente,
//por lo que las contrasenas hasheadas con factor 10 SIGUEN funcionando.
//Las nuevas contrasenas / actualizaciones / restablecimientos pasaran a 12.
export const BCRYPT_ROUNDS = 12;

//Helper centralizado para hashear contrasenas, asi nadie usa un numero magico.
export const hashPassword = (passwordPlana) =>
  bcrypt.hash(passwordPlana, BCRYPT_ROUNDS);

//-------------------------------------------------------------------------
// TOKENS INTERNOS (reset_token, token_verificacion)
//-------------------------------------------------------------------------
//Hasta el Bloque 5, los tokens internos se guardaban en CLARO en la BD.
//Si la BD se filtraba, un atacante podia:
//   - verificar emails de empresas ajenas con su token_verificacion
//   - restablecer la contrasenya de cualquier usuario con su reset_token
//
//Solucion estandar: el cliente recibe el token en CLARO (en la URL del email),
//pero en BD guardamos sha256(token). Como sha256 es determinista y rapido
//(no necesita "salt" para tokens aleatorios largos), basta con compararlo
//cuando el usuario presenta el token.
//
//IMPORTANTE: este cambio rompe los tokens existentes en BD. No es un problema:
//   - los reset_token vivos vencen en 1 hora (campo reset_token_expira)
//   - los token_verificacion solo bloquean el alta de empresas no verificadas,
//     que pueden pedir reenvio (/empresas/reenviar-verificacion)
//Tras desplegar conviene avisar a esos usuarios o limpiar las filas antiguas.

//Hash sha256 hex de un token. Se usa para guardar el token en BD y para
//comparar con el que el usuario presenta en la URL del email.
export const hashToken = (tokenPlano) =>
  createHash("sha256").update(String(tokenPlano)).digest("hex");

//Genera un token aleatorio criptograficamente seguro (64 chars hex = 256 bits).
//Devuelve { plano, hash }: el plano se envia al usuario por email; el hash es
//lo que se guarda en BD.
export const generarTokenReset = () => {
  const plano = randomBytes(32).toString("hex");
  return { plano, hash: hashToken(plano) };
};

//Idem pero usa UUID v4 para el token (mas corto y URL-friendly). Lo usamos
//para token_verificacion para no cambiar el formato visible en los emails.
export const generarTokenVerificacion = () => {
  const plano = randomUUID();
  return { plano, hash: hashToken(plano) };
};
