"use strict";
import { HistorialPrecioEmpresa } from "../models/historialPrecioEmpresa.model.js";
import { esSuperadmin } from "../utils/tenant.js";

//Tenant: este historial es por empresa. Limitamos al empresa_id del JWT
//(superadmin ve todo). Antes devolviamos el historial completo del SaaS al cliente.
export const obtenerHistorialPreciosEmpresa = async (req, res) => {
  try {
    const where = esSuperadmin(req)
      ? {}
      : { empresa_id: req.user.empresa_id };

    const historial = await HistorialPrecioEmpresa.findAll({ where });

    //lista vacia -> 200 + []
    return res.status(200).json(historial);
  } catch (error) {
    console.error("[obtenerHistorialPreciosEmpresa] error:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener historial de precios empresa" });
  }
};
