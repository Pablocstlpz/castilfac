"use strict";
import { PlantillaProducto } from "../models/plantillaProducto.model.js";
import { assertEmpresaIdParam } from "../utils/tenant.js";

export const getPlantillasProducto = async (req, res) => {
  try {
    const plantillas = await PlantillaProducto.findAll();
    //lista vacia -> 200 + []
    res.status(200).json(plantillas);
  } catch (error) {
    console.error("[getPlantillasProducto] error:", error);
    res.status(500).json({ message: "Error al obtener las plantillas" });
  }
};

export const getPlantillaProductoPorIdEmpresa = async (req, res) => {
  try {
    //Tenant: el :id es empresa_id; debe coincidir con el del JWT.
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const { id } = req.params;
    const plantilla = await PlantillaProducto.findAll({
      where: { empresa_id: id },
    });
    res.status(200).json(plantilla);
  } catch (error) {
    console.error("[getPlantillaProductoPorIdEmpresa] error:", error);
    res.status(500).json({ message: "Error al obtener la plantilla" });
  }
};

