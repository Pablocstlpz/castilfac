import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const PrecioEmpresa = sequelize.define(
  "PrecioEmpresa",
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
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precio_venta: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    porcentaje_merma: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 10.0,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
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
  },
  {
    tableName: "precios_empresa",
    timestamps: false, // Usamos columnas manuales de fecha
  },
);
