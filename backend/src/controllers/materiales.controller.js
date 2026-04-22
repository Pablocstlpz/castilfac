"use strict";
import { Material } from "../models/material.model.js";

export const obtenerMateriales = async (req, res) => {
  try {
    //obtener todos los materiales de la base de datos
    const materiales = await Material.findAll();

    //validar que el resultado no sea nulo o vacío
    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ error: "No se encontraron materiales" });
    }

    //si hay datos, envio el resultado como JSON
    res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: "Error al obtener materiales" });
  }
};

export const obtenerMaterialPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    //validar que el resultado no sea nulo
    if (!material) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    //si hay datos, envio el resultado como JSON
    res.status(200).json(material);
  } catch (error) {
    console.error("Error al obtener material por ID:", error);
    res.status(500).json({ error: "Error al obtener material por ID" });
  }
};
