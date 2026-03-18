import { DataTypes } from 'sequelize';
import { sequelize } from '../data/db.js';

export const Pedido = sequelize.define(
    'Pedido',
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
        numero_pedido: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        presupuesto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        cliente_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        estado_fabricacion: {
            type: DataTypes.ENUM(
                'pendiente',
                'en_fabricacion',
                'fabricado',
                'entregado',
                'instalado',
                'finalizado',
                'cancelado'
            ),
            allowNull: true,
            defaultValue: 'pendiente',
        },
        fecha_pedido: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        fecha_inicio_estimada: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        fecha_entrega_estimada: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        fecha_entrega_real: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        fecha_instalacion: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        importe_acordado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        importe_pagado: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.0,
        },
        operario_asignado_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        notas_operario: {
            type: DataTypes.TEXT,
            allowNull: true,
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
    },
    {
        tableName: 'pedidos',
        timestamps: false,
    }
);