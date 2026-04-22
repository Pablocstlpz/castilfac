"use strict";
import { PlantillaMaterial } from "../models/plantillaMaterial.model.js";

export const getPlantillasMateriales = async (req, res) => {
  try {
    const { plantilla_id } = req.params;
    const plantillasMateriales = await PlantillaMaterial.findAll({
      where: { plantilla_id },
    });
    res.json(plantillasMateriales);
  } catch (error) {
    console.error("Error al obtener plantillas materiales:", error);
    res.status(500).json({ error: "Error al obtener plantillas materiales" });
  }
};
