"use strict";
import { HistorialPrecioEmpresa } from "../models/historialPrecioEmpresa.model.js";
import { esSuperadmin } from "../utils/tenant.js";

//funcion para obtener el historial de precios de empresa
//antes devolvia el historial completo de TODO el SaaS a cualquier usuario logado
//ahora filtra por el empresa_id del JWT para que cada empresa solo vea el suyo (salvo superadmin)
export const obtenerHistorialPreciosEmpresa = async (req, res) => {
  try {
    //si es superadmin lo dejo ver todo el historial, si no solo el de su empresa
    const where = esSuperadmin(req)
      ? {}
      : { empresa_id: req.user.empresa_id };

    const historial = await HistorialPrecioEmpresa.findAll({ where });

    //si no hay registros devuelvo array vacio con 200 para que el frontend no falle
    return res.status(200).json(historial);
  } catch (error) {
    console.error("[obtenerHistorialPreciosEmpresa] error:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener historial de precios empresa" });
  }
};
