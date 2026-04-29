"use strict";

import { Op } from "sequelize";
import { Presupuesto } from "../models/presupuesto.model.js";
import { Cliente } from "../models/cliente.model.js";
import { Elemento } from "../models/elemento.model.js";
import { ElementoMaterial } from "../models/elementoMaterial.model.js";
import { Material } from "../models/material.model.js";

export const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuesto = await Presupuesto.findByPk(id);
    if (!presupuesto) {
      return res.status(404).json({ message: "Presupuesto no encontrado" });
    }

    const cliente = await Cliente.findByPk(presupuesto.cliente_id, {
      attributes: ["nombre_empresa_o_particular"],
    });

    const elementosRaw = await Elemento.findAll({
      where: { presupuesto_id: id },
      order: [["orden", "ASC"]],
    });

    const elementoIds = elementosRaw.map((e) => e.id);

    let elementosMaterialesRaw = [];
    let materiales = [];

    if (elementoIds.length > 0) {
      elementosMaterialesRaw = await ElementoMaterial.findAll({
        where: { elemento_id: { [Op.in]: elementoIds } },
      });

      const materialIds = [
        ...new Set(elementosMaterialesRaw.map((em) => em.material_id)),
      ];

      if (materialIds.length > 0) {
        materiales = await Material.findAll({
          where: { id: { [Op.in]: materialIds } },
          attributes: ["id", "nombre", "codigo_interno", "tipo_unidad"],
        });
      }
    }

    const materialesMap = {};
    materiales.forEach((m) => {
      materialesMap[m.id] = m.dataValues;
    });

    const elementos = elementosRaw.map((e) => ({
      id: e.id,
      nombre: e.descripcion,
      cantidad: e.cantidad,
      precio_final: e.coste_linea,
      materiales_desglose: elementosMaterialesRaw
        .filter((em) => em.elemento_id === e.id)
        .map((em) => ({
          id: em.id,
          cantidad: em.cantidad_calculada,
          precio_unitario_aplicado: em.precio_congelado,
          Material: materialesMap[em.material_id] ?? null,
        })),
    }));

    const resultado = {
      ...presupuesto.dataValues,
      cliente_nombre: cliente
        ? cliente.nombre_empresa_o_particular
        : "Cliente desconocido",
      elementos,
    };

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el presupuesto" });
  }
};

export const getPresupuestos = async (req, res) => {
  try {
    const { id } = req.params;
    const presupuestos = await Presupuesto.findAll({
      where: { empresa_id: id },
    });

    if (!presupuestos) {
      return res
        .status(404)
        .json({ message: "No se encontraron presupuestos para esta empresa" });
    }

    res.status(200).json(presupuestos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los presupuestos" });
  }
};
