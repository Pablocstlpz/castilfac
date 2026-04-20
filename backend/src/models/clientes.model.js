import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const Cliente = sequelize.define(
  "Cliente",
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
    nombre_empresa_o_particular: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nif_cif: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    tipo_cliente: {
      type: DataTypes.ENUM("particular", "empresa", "vip", "mayorista"),
      allowNull: false,
      defaultValue: "particular",
    },
    descuento_fijo: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "clientes",
    timestamps: false, // Usamos tus columnas manuales de fecha
  },
);
