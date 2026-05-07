

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
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true,
    },
    },
    password: {
      type: DataTypes.STRING(60), //la librería Bcrypt tiene siempre exactamente 60 caracteres
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM('admin', 'operario'),
      allowNull: true,
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
      type: DataTypes.STRING(100), //token de restablecimiento de contraseña, se genera con randomBytes(32) que produce 64 caracteres hexadecimales
      allowNull: true,
    },
    reset_token_expira: {
      type: DataTypes.DATE, //fecha de expiracion del token, sera valido durante 1 hora desde su generacion
      allowNull: true,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: false, // ya tienes columnas de fecha propias
  }
);