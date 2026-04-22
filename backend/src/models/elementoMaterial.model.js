import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const ElementoMaterial = sequelize.define(
  "ElementoMaterial",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    elemento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre_material_snapshot: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    cantidad_calculada: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    precio_congelado: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    descuento_aplicado: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    coste_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "elementos_materiales",
    timestamps: false,
  },
);
