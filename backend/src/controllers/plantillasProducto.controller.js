"use strict";
import { PlantillaProducto } from "../models/plantillaProducto.model.js";
import { assertEmpresaIdParam } from "../utils/tenant.js";

//funcion para obtener todas las plantillas de producto (catalogo comun a todas las empresas)
export const getPlantillasProducto = async (req, res) => {
  try {
    const plantillas = await PlantillaProducto.findAll();
    //si no hay plantillas devuelvo array vacio con 200 para que el frontend no falle
    res.status(200).json(plantillas);
  } catch (error) {
    console.error("[getPlantillasProducto] error:", error);
    res.status(500).json({ message: "Error al obtener las plantillas" });
  }
};

//funcion para obtener las plantillas de producto de una empresa concreta
export const getPlantillaProductoPorIdEmpresa = async (req, res) => {
  try {
    //el :id de la URL es el empresa_id, compruebo que coincida con el del JWT
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
