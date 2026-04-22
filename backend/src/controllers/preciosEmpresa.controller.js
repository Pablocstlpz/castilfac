"use strict";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";

export const getPrecioEmpresa = async (req, res) => {
  try {
    const empresa_id = req.params.id;

    //busco en la tabla por el empresa_id = idPrecio
    const precio = await PrecioEmpresa.findAll({
      where: { empresa_id: empresa_id },
    });

    if (!precio) {
      return res.status(404).json({ message: "Precio no encontrado" });
    }

    res.status(200).json(precio);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
