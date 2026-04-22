"use strict";

import { Presupuesto } from "../models/presupuesto.model.js";

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
