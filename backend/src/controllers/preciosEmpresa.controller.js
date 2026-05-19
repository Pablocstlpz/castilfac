"use strict";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";
import { HistorialPrecioEmpresa } from "../models/historialPrecioEmpresa.model.js";
import { Material } from "../models/material.model.js";
import { sequelize } from "../data/db.js";
import {
  assertEmpresaIdParam,
  empresaIdEfectivo,
} from "../utils/tenant.js";

//funcion para obtener todos los precios de empresa por su empresa_id
export const getPrecioEmpresa = async (req, res) => {
  try {
    //el :id de la URL es el empresa_id, compruebo que coincida con el del JWT
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const empresa_id = req.params.id;

    //busco todos los precios asociados a esta empresa
    const precio = await PrecioEmpresa.findAll({
      where: { empresa_id: empresa_id },
    });

    //si no hay precios devuelvo array vacio con 200 para que el frontend no falle
    res.status(200).json(precio);
  } catch (error) {
    console.error("[getPrecioEmpresa] error:", error);
    res.status(500).json({ message: "Error al obtener los precios" });
  }
};

//funcion para actualizar el PVP de empresa de un material y registrar el cambio en el historial
//uso una transaccion para que la actualizacion del precio y el insert en historial vayan juntos o no se haga ninguno
export const actualizarPrecioPvp = async (req, res) => {
  const transaccion = await sequelize.transaction();

  try {
    const { material_id, usuario_id, nuevo_precio } = req.body;

    //el empresa_id se coge del JWT, no del body
    //asi un body manipulado no puede actualizar precios de otra empresa
    const empresa_id = empresaIdEfectivo(req);

    //valido que esten todos los campos necesarios antes de seguir
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

    //busco si ya existe un precio para este material en esta empresa
    const precioExistente = await PrecioEmpresa.findOne({
      where: { material_id: material_id, empresa_id: empresa_id },
      transaction: transaccion,
    });

    //guardo el precio anterior antes de sobreescribirlo para dejarlo en el historial
    //si es la primera vez que se fija precio para este material no habia valor previo y queda en null
    const precioAnterior = precioExistente ? precioExistente.precio_venta : null;

    let registroPrecioEmpresa;

    if (precioExistente) {
      //actualizo el registro existente con el nuevo precio y el usuario que hace el cambio
      await precioExistente.update(
        { precio_venta: nuevo_precio, usuario_id: usuario_id },
        { transaction: transaccion },
      );
      registroPrecioEmpresa = precioExistente;
    } else {
      //si no existia registro previo, busco el material para confirmar que existe
      const materialEncontrado = await Material.findByPk(material_id, {
        transaction: transaccion,
      });

      //compruebo tenant: el material debe pertenecer a la misma empresa
      //si no, devuelvo 404 para no filtrar la existencia de un material ajeno
      if (
        !materialEncontrado ||
        String(materialEncontrado.empresa_id) !== String(empresa_id)
      ) {
        await transaccion.rollback();
        return res.status(404).json({ message: "Material no encontrado" });
      }

      //creo el nuevo registro de precio de empresa con el precio que ha introducido el usuario
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

    //registro el cambio en el historial de precios de empresa
    //esto se hace siempre, tanto si era creacion como si era actualizacion del registro de precio
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

    //todo ha ido bien, hago commit para guardar los cambios
    await transaccion.commit();

    return res.status(200).json({ message: "Precio PVP actualizado correctamente" });
  } catch (error) {
    //si algo falla hago rollback para no dejar datos inconsistentes
    await transaccion.rollback();
    console.error("Error al actualizar precio PVP empresa:", error);
    return res
      .status(500)
      .json({ message: "Error al actualizar el precio PVP empresa" });
  }
};
