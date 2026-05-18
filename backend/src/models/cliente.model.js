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
    //BD: varchar(150), si pongo mas grande MariaDB rompe los inserts >150
    nombre_empresa_o_particular: {
      type: DataTypes.STRING(150),
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
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: { isEmail: true },
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    //las 3 columnas siguientes existian en BD pero faltaban en el modelo
    //sin ellas sequelize las ignoraba en INSERT/UPDATE y nunca se persistia la direccion completa
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
    notas: {
      //columna que existia en BD pero no en el modelo
      type: DataTypes.TEXT,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "clientes",
    //la BD gestiona fecha_registro y fecha_actualizacion con DEFAULT y ON UPDATE CURRENT_TIMESTAMP
    //pongo timestamps: false para que sequelize no intente meter sus propias columnas createdAt/updatedAt
    timestamps: false,
  },
);
