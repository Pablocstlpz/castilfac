//import mysql from "mysql2/promise";
import {Sequelize} from 'sequelize'

import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_USER } from "../config.js";

// export const pool = mysql.createPool({
//     host: DB_HOST,  // Dirección del servidor MySQL (usualmente 'localhost' si está en tu máquina local)
//     user: DB_USER,       // Nombre de usuario para conectarse a la base de datos
//     password: DB_PASSWORD,       // Contraseña del usuario (debe ser configurada si tienes una contraseña definida)
//     database: DB_DATABASE, // Nombre de la base de datos a la que deseas conectarte
//     waitForConnections: true,    // Espera conexiones si todas están ocupadas
//     connectionLimit: 10,         // Número máximo de conexiones simultáneas en el pool
//     queueLimit: 0,               // Límite para la cola de solicitudes (0 significa ilimitado)
//     connectTimeout:10000
// });

export const sequelize = new Sequelize(DB_DATABASE, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: "mysql",
   // Configuración del pool de conexiones (equivalente a la configuración anterior)
  pool: {
        max: 10,              // connectionLimit: número máximo de conexiones
        min: 0,               // mínimo de conexiones
        acquire: 30000,       // tiempo máximo para obtener una conexión (30 segundos)
        idle: 10000,          // tiempo máximo que una conexión puede estar inactiva
        evict: 10000          // tiempo para verificar y eliminar conexiones inactivas
    },
  logging: false, //no muestra en consola  las consultas SQL.
});

console.log('Pool creado');
// Función para verificar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate(); //const connection = await pool.getConnection();
        console.log('Conexión con MySQL establecida correctamente');
       
    } catch (error) {
        console.error(`Error al conectar con MySQL:  ${error.message}`);
    }
};


// Verificar conexión al iniciar
testConnection();



// ... tienes ya export const sequelize = new Sequelize(...)

export const conexionBD = async () => {
  // Por compatibilidad: devolvemos la instancia de Sequelize
  return sequelize;
};