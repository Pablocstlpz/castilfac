import { DataTypes } from "sequelize";
import { sequelize } from "../data/db.js";

export const Elemento = sequelize.define(
    "Elemento",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        presupuesto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        orden: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        tipo_producto: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        descripcion: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        medida_ancho: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
        },
        medida_alto: {
            type: DataTypes.DECIMAL(8, 2),
            allowNull: false,
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        tiempo_estimado_minutos: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        notas_fabricacion: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        coste_linea: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.0,
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "elementos",
        timestamps: false, // Usamos columnas manuales de fecha
    },
);
