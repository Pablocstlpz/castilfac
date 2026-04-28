import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const HistorialPrecioBase = sequelize.define(
    "HistorialPrecioBase",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        usuario_admin_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        motivo: {
            type: DataTypes.STRING(255),
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
        tableName: "historial_precios_base",
        timestamps: false,
    },
);
