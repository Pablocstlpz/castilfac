import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const Material = sequelize.define(
  "Material",
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
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigo_interno: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
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
    tipo_unidad: {
      //alineado con el ENUM real de la BD (solo 4 valores)
      //antes tenia "litros" tambien y se rompia el insert porque MariaDB no lo aceptaba
      type: DataTypes.ENUM(
        "metros_lineales",
        "metros_cuadrados",
        "unidades",
        "kilogramos",
      ),
      allowNull: false,
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    porcentaje_merma_recomendado: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 10.0,
    },
    proveedor: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: null,
    },
    referencia_proveedor: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    atributos_extra: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    imagen_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
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
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "materiales",
    timestamps: false, //ya tengo columnas de fecha propias
  },
);
