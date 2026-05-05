"use strict";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";
import { HistorialPrecioEmpresa } from "../models/historialPrecioEmpresa.model.js";
import { Material } from "../models/material.model.js";
import { sequelize } from "../data/db.js";

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

export const actualizarPrecioPvp = async (req, res) => {
  // Inicio la transacción para garantizar que la actualización del precio y el registro en historial
  // se realizan juntos, o ninguno si ocurre algún error en cualquiera de los dos pasos
  const transaccion = await sequelize.transaction();

  try {
    const { material_id, empresa_id, usuario_id, nuevo_precio } = req.body;

    // Valido que todos los campos obligatorios están presentes antes de continuar
    if (
      !material_id ||
      !empresa_id ||
      !usuario_id ||
      nuevo_precio === undefined ||
      nuevo_precio === null
    ) {
      await transaccion.rollback();
      return res.status(400).json({
        message:
          "Faltan campos obligatorios: material_id, empresa_id, usuario_id, nuevo_precio",
      });
    }

    // Busco si ya existe un registro de precio de empresa para este material y empresa concretos
    const precioExistente = await PrecioEmpresa.findOne({
      where: { material_id: material_id, empresa_id: empresa_id },
      transaction: transaccion,
    });

    // Guardo el precio anterior antes de sobreescribirlo, para dejarlo en el historial
    // Si es la primera vez que se fija el precio, no había valor previo y lo dejamos en null
    const precioAnterior = precioExistente ? precioExistente.precio_venta : null;

    let registroPrecioEmpresa;

    if (precioExistente) {
      // Actualizo el registro existente con el nuevo precio y el usuario que hace la modificación
      await precioExistente.update(
        { precio_venta: nuevo_precio, usuario_id: usuario_id },
        { transaction: transaccion },
      );
      registroPrecioEmpresa = precioExistente;
    } else {
      // Si no existe ningún registro previo, busco el material para confirmar que existe
      const materialEncontrado = await Material.findByPk(material_id, {
        transaction: transaccion,
      });

      if (!materialEncontrado) {
        await transaccion.rollback();
        return res.status(404).json({ message: "Material no encontrado" });
      }

      // Creo el nuevo registro de precio de empresa con el precio que el usuario ha introducido
      registroPrecioEmpresa = await PrecioEmpresa.create(
        {
          empresa_id: empresa_id,
          material_id: material_id,
          precio_venta: nuevo_precio,
          usuario_id: usuario_id,
        },
        { transaction: transaccion },
      );
    }

    // Registramos el cambio de precio en el historial de forma explícita desde el controller,
    // independientemente de si fue una creación o una actualización del registro de precio empresa
    await HistorialPrecioEmpresa.create(
      {
        precio_empresa_id: registroPrecioEmpresa.id,
        empresa_id: empresa_id,
        material_id: material_id,
        precio_anterior: precioAnterior,
        precio_nuevo: nuevo_precio,
        usuario_id: usuario_id,
      },
      { transaction: transaccion },
    );

    // Todo ha ido bien, confirmo la transacción para que el cambio quede guardado
    await transaccion.commit();

    return res.status(200).json({ message: "Precio PVP actualizado correctamente" });
  } catch (error) {
    // Si ha ocurrido cualquier error revierto la transacción para no dejar datos inconsistentes
    await transaccion.rollback();
    console.error("Error al actualizar precio PVP empresa:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar el precio PVP empresa" });
  }
};
