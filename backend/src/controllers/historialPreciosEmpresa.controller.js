"use strict";
import { HistorialPrecioEmpresa } from "../models/historialPrecioEmpresa.model.js";

export const obtenerHistorialPreciosEmpresa = async (req, res) => {
    try {
        const historialPreciosEmpresa = await HistorialPrecioEmpresa.findAll();
        //validar que el resultado no sea nulo o vacío
        if (!historialPreciosEmpresa || historialPreciosEmpresa.length === 0) {
            //devuelvo un mensaje de error al usuario si no hay historial de precios empresa
            return res.status(404).json({ error: "No se encontraron historial de precios empresa" });
        }
        //si hay datos, envio el resultado como JSON
        return res.status(200).json(historialPreciosEmpresa);
    } catch (error) {
        //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
        console.error("Error al obtener historial de precios empresa:", error);
        //devuelvo un mensaje de error al usuario si hay algun error
        return res.status(500).json({ error: "Error al obtener historial de precios empresa" });
    }
};