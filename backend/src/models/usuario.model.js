import { DataTypes } from 'sequelize';
import { sequelize } from '../data/db.js';

export const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      //BD: varchar(100), si pongo mas grande MariaDB rompe los inserts >100
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { isEmail: true },
    },
    password: {
      //BD: varchar(255), lo dejo asi para tener margen por si en el futuro uso otro algoritmo
      //bcrypt son 60 chars, argon2 unos 96, asi no me veo limitado
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      //alineado con el ENUM real de la BD que incluye superadmin
      type: DataTypes.ENUM('admin', 'operario', 'superadmin'),
      allowNull: true,
      defaultValue: 'operario',
    },
    activo: {
      //la columna existia en BD pero faltaba en el modelo, sin esto sequelize la ignora
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reset_token: {
      //guardo el sha256 del token de reset, no el token plano
      //el plano solo va por email para que el usuario lo presente al restablecer
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    reset_token_expira: {
      //fecha de expiracion del token de reset, sera valido durante 1 hora desde que se genera
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: false, //ya tengo columnas de fecha propias
  }
);

//limpieza automatica al serializar el modelo a JSON
//asi cualquier res.json(usuario) o JSON.stringify(usuario) ya no manda el hash bcrypt ni el token de reset
//y no tengo que ir uno por uno por cada controller eliminando estos campos a mano
//si necesito el password en codigo (ej. en el login para bcrypt.compare) lo accedo via usuario.password
//porque toJSON solo afecta a la serializacion, no al objeto en memoria
Usuario.prototype.toJSON = function () {
  const datos = { ...this.get() };
  delete datos.password;
  delete datos.reset_token;
  delete datos.reset_token_expira;
  return datos;
};
