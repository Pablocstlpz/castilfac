import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const PlantillaProducto = sequelize.define(
  "PlantillaProducto",
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
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    categoria_producto: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    tiempo_fabricacion_base_minutos: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "plantillas_producto",
    timestamps: false, // Usamos columnas manuales de fecha
  },
);
