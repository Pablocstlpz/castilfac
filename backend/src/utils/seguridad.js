import bcrypt from "bcrypt";

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
