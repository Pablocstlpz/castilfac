"use strict";

import { Presupuesto } from "../models/presupuesto.model.js";

// Controlador para obtener un presupuesto por su ID
export const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;
    const presupuesto = await Presupuesto.findByPk(id);

    if (!presupuesto) {
      return res.status(404).json({ message: "Presupuesto no encontrado" });
    }

    res.status(200).json(presupuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el presupuesto" });
  }
};

// Controlador para obtener todos los presupuestos de una empresa
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
