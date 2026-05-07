
import { DataTypes } from 'sequelize';
import { sequelize } from '../data/db.js';

export const Empresa = sequelize.define(
  'Empresa',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_comercial: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    nif: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    codigo_postal: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provincia: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    suscripcion_activa: {
      type: DataTypes.BOOLEAN, 
      allowNull: true,
      defaultValue: 0,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    email_verificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    token_verificacion: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: 'empresas',
    timestamps: false, // ya tienes columnas de fecha propias
  }
);