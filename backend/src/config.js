import {config} from 'dotenv'

config(); //leo las variables de entorno del .env

export const PORT=process.env.PORT
export const DB_PORT=process.env.DB_PORT
export const DB_HOST=process.env.DB_HOST
export const DB_USER=process.env.DB_USER
export const DB_PASSWORD=process.env.DB_PASSWORD
export const DB_DATABASE=process.env.DB_DATABASE
export const EMAIL_USER=process.env.EMAIL_USER
export const EMAIL_PASS=process.env.EMAIL_PASS
export const URL=process.env.URL
export const FRONTEND_URL=process.env.FRONTEND_URL
export const GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID
export const SECRET_KEY=process.env.SECRET_KEY
//si no hay REFRESH_SECRET_KEY caigo a SECRET_KEY para no romper entornos antiguos
export const REFRESH_SECRET_KEY=process.env.REFRESH_SECRET_KEY || process.env.SECRET_KEY

//variables que SIEMPRE deben estar definidas para que la app arranque
const VARIABLES_REQUERIDAS = [
  "SECRET_KEY",
  "GOOGLE_CLIENT_ID",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_DATABASE",
];

//funcion para validar que el .env tiene todo lo necesario antes de arrancar
//si falta algo me sale por consola y mato el proceso para no levantar a medias
export const validarConfig = () => {
  const faltan = VARIABLES_REQUERIDAS.filter((k) => !process.env[k]);
  if (faltan.length) {
    console.error(
      "[config] Faltan variables de entorno:",
      faltan.join(", "),
      "\nEn Docker: backend/.env + .env en la raíz del proyecto (para docker compose).",
    );
    process.exit(1);
  }
};
