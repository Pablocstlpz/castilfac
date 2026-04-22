import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const Presupuesto = sequelize.define(
  "Presupuesto",
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
    numero_presupuesto: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    coste_materiales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    coste_mano_obra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    otros_costes: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    detalle_otros_costes: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    porcentaje_beneficio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    precio_sin_descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    descuento_aplicado: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    motivo_descuento: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    precio_final: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    estado: {
      type: DataTypes.ENUM(
        "borrador",
        "enviado",
        "aprobado",
        "rechazado",
        "aceptado",
        "anulado",
        "facturado",
      ),
      allowNull: false,
      defaultValue: "borrador",
    },
    valido_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    fecha_respuesta: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    notas_internas: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    notas_cliente: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "presupuestos",
    timestamps: false, // Usamos columnas manuales de fecha
  },
);
