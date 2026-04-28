"use strict";
import { ElementoMaterial } from "../models/elementoMaterial.model.js";

export const obtenerElementosMateriales = async (req, res) => {
    try {
        const elementosMateriales = await ElementoMaterial.findAll();
        //validar que el resultado no sea nulo o vacío
        if (!elementosMateriales || elementosMateriales.length === 0) {
            //devuelvo un mensaje de error al usuario si no hay elementos materiales
            return res.status(404).json({ error: "No se encontraron elementos materiales" });
        }
        //si hay datos, envio el resultado como JSON
        return res.status(200).json(elementosMateriales);
    } catch (error) {
        //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
        console.error("Error al obtener elementos materiales:", error);
        //devuelvo un mensaje de error al usuario si hay algun error
        return res.status(500).json({ error: "Error al obtener elementos materiales" });
    }
};