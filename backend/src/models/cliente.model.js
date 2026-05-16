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
    //BD: varchar(150). Antes el modelo decia 255 y aceptaba inserts que MariaDB
    //truncaba o rechazaba si el sql_mode estaba estricto.
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
    //Las 3 columnas siguientes existian en BD pero faltaban en el modelo.
    //Sin ellas, Sequelize las ignoraba en INSERT/UPDATE y SELECT.
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
      //Existia en BD, faltaba en el modelo.
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
    //La BD tiene fecha_registro / fecha_actualizacion gestionadas via DEFAULT y
    //ON UPDATE CURRENT_TIMESTAMP. Mantenemos timestamps: false para no chocar.
    timestamps: false,
  },
);
