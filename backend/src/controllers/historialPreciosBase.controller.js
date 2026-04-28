"use strict";
import { HistorialPrecioBase } from "../models/historialPrecioBase.model.js";

export const obtenerHistorialPreciosBase = async (req, res) => {
    try {
        const historialPreciosBase = await HistorialPrecioBase.findAll();
        //validar que el resultado no sea nulo o vacío
        if (!historialPreciosBase || historialPreciosBase.length === 0) {
            //devuelvo un mensaje de error al usuario si no hay historial de precios base
            return res.status(404).json({ error: "No se encontraron historial de precios base" });
        }
        //si hay datos, envio el resultado como JSON
        return res.status(200).json(historialPreciosBase);
    } catch (error) {
        //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
        console.error("Error al obtener historial de precios base:", error);
        //devuelvo un mensaje de error al usuario si hay algun error
        return res.status(500).json({ error: "Error al obtener historial de precios base" });
    }
};