import {config} from 'dotenv'

config(); //leer las variables de entorno

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