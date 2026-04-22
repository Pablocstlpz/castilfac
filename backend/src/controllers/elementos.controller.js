"use strict";
import { Elemento } from "../models/elemento.model.js";

export const obtenerElementos = async (req, res) => {
    try {
        const elementos = await Elemento.findAll();

        //validar que el resultado no sea nulo o vacío
        if (!elementos || elementos.length === 0) {
            //devuelvo un mensaje de error al usuario si no hay elementos
            return res.status(404).json({ error: "No se encontraron elementos" });
        }
        //si hay datos, envio el resultado como JSON
        return res.status(200).json(elementos);
    } catch (error) {
        //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
        console.error("Error al obtener elementos:", error);
        //devuelvo un mensaje de error al usuario si hay algun error
        return res.status(500).json({ error: "Error al obtener elementos" });
    }
};