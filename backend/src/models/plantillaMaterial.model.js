import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const PlantillaMaterial = sequelize.define(
  "PlantillaMaterial",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plantilla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_calculo: {
      type: DataTypes.ENUM(
        "perimetro",
        "area",
        "fijo",
        "por_metro_ancho",
        "por_metro_largo",
      ),
      allowNull: false,
    },
    cantidad_fija: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      defaultValue: null,
    },
    factor_desperdicio: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: true,
      defaultValue: 0.1,
    },
  },
  {
    tableName: "plantillas_materiales",
    timestamps: false, // No hay columnas de fecha
  },
);
