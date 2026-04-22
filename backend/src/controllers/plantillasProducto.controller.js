"use strict";
import { PlantillaProducto } from "../models/plantillaProducto.model.js";

export const getPlantillasProducto = async (req, res) => {
  try {
    const plantillas = await PlantillaProducto.findAll();
    if (plantillas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron plantillas de producto" });
    }
    res.status(200).json(plantillas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlantillaProductoPorIdEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const plantilla = await PlantillaProducto.findAll({
      where: { empresa_id: id },
    });
    if (!plantilla) {
      return res.status(404).json({
        message:
          "No se encontró la plantilla de producto para la empresa especificada",
      });
    }
    res.status(200).json(plantilla);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
