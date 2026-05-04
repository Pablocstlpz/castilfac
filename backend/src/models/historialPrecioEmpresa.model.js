import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const HistorialPrecioEmpresa = sequelize.define(
  "HistorialPrecioEmpresa",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    precio_empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precio_anterior: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      defaultValue: null,
    },
    precio_nuevo: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    fecha_registro: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "historial_precios_empresa",
    timestamps: false,
  },
);
