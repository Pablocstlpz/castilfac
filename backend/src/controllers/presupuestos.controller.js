"use strict";

import { Op } from "sequelize";
import { sequelize } from "../data/db.js";
import { Presupuesto } from "../models/presupuesto.model.js";
import { Cliente } from "../models/cliente.model.js";
import { Elemento } from "../models/elemento.model.js";
import { ElementoMaterial } from "../models/elementoMaterial.model.js";
import { Material } from "../models/material.model.js";
import {
  assertEmpresaIdParam,
  assertOwnsRecurso,
  empresaIdEfectivo,
} from "../utils/tenant.js";
import { logger } from "../utils/logger.js";

export const patchEstadoPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const presupuesto = await Presupuesto.findByPk(id);
    //Tenant: el presupuesto debe ser de la empresa del JWT.
    if (!assertOwnsRecurso(req, res, presupuesto)) return;

    await presupuesto.update({ estado, fecha_actualizacion: new Date() });
    res.status(200).json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("[patchEstadoPresupuesto] error:", error);
    res.status(500).json({ message: "Error al actualizar el estado" });
  }
};

export const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuesto = await Presupuesto.findByPk(id);
    if (!assertOwnsRecurso(req, res, presupuesto)) return;

    const cliente = await Cliente.findByPk(presupuesto.cliente_id, {
      attributes: ["nombre_empresa_o_particular"],
    });

    const elementosRaw = await Elemento.findAll({
      where: { presupuesto_id: id },
      order: [["orden", "ASC"]],
    });

    const elementoIds = elementosRaw.map((e) => e.id);

    let elementosMaterialesRaw = [];
    let materiales = [];

    if (elementoIds.length > 0) {
      elementosMaterialesRaw = await ElementoMaterial.findAll({
        where: { elemento_id: { [Op.in]: elementoIds } },
      });

      const materialIds = [
        ...new Set(elementosMaterialesRaw.map((em) => em.material_id)),
      ];

      if (materialIds.length > 0) {
        materiales = await Material.findAll({
          where: { id: { [Op.in]: materialIds } },
          attributes: ["id", "nombre", "codigo_interno", "tipo_unidad", "porcentaje_merma_recomendado"],
        });
      }
    }

    const materialesMap = {};
    materiales.forEach((m) => {
      materialesMap[m.id] = m.dataValues;
    });

    const elementos = elementosRaw.map((e) => ({
      id: e.id,
      descripcion: e.descripcion,
      cantidad: e.cantidad,
      medida_ancho: parseFloat(e.medida_ancho) || 1,
      medida_alto: parseFloat(e.medida_alto) || 1,
      tiempo_estimado_minutos: e.tiempo_estimado_minutos || 0,
      notas_fabricacion: e.notas_fabricacion || '',
      orden: e.orden,
      coste_linea: parseFloat(e.coste_linea) || 0,
      materiales_desglose: elementosMaterialesRaw
        .filter((em) => em.elemento_id === e.id)
        .map((em) => {
          const mat = materialesMap[em.material_id] ?? {};
          return {
            id: em.id,
            material_id: em.material_id,
            nombre_material_snapshot: em.nombre_material_snapshot,
            cantidad_calculada: parseFloat(em.cantidad_calculada) || 0,
            precio_congelado: parseFloat(em.precio_congelado) || 0,
            factor_desperdicio: mat.porcentaje_merma_recomendado || 10,
            tipo_unidad: mat.tipo_unidad || 'unidades',
            coste_total: parseFloat(em.cantidad_calculada) * parseFloat(em.precio_congelado) || 0,
          };
        }),
    }));

    const presupuestoPlano = presupuesto.toJSON();
    const resultado = {
      ...presupuestoPlano,
      coste_materiales: parseFloat(presupuestoPlano.coste_materiales) || 0,
      coste_mano_obra: parseFloat(presupuestoPlano.coste_mano_obra) || 0,
      otros_costes: parseFloat(presupuestoPlano.otros_costes) || 0,
      porcentaje_beneficio: parseFloat(presupuestoPlano.porcentaje_beneficio) || 0,
      precio_sin_descuento: parseFloat(presupuestoPlano.precio_sin_descuento) || 0,
      descuento_aplicado: parseFloat(presupuestoPlano.descuento_aplicado) || 0,
      precio_final: parseFloat(presupuestoPlano.precio_final) || 0,
      cliente_nombre: cliente ? cliente.nombre_empresa_o_particular : "Cliente desconocido",
      elementos,
    };

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el presupuesto" });
  }
};

export const getPresupuestos = async (req, res) => {
  try {
    //Tenant: el :id es empresa_id en /empresas/:id/presupuestos.
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const { id } = req.params;
    const presupuestos = await Presupuesto.findAll({
      where: { empresa_id: id },
    });

    //lista vacia -> 200 + [] (antes daba 404 erroneamente)
    res.status(200).json(presupuestos);
  } catch (error) {
    console.error("[getPresupuestos] error:", error);
    res.status(500).json({ message: "Error al obtener los presupuestos" });
  }
};

// CREAR PRESUPUESTO
export const createPresupuesto = async (req, res) => {
  const transaccion = await sequelize.transaction();

  try {
    const {
      usuario_id,
      cliente_id,
      numero_presupuesto,
      estado,
      notas_internas,
      notas_cliente,
      valido_hasta,
      coste_materiales,
      coste_mano_obra,
      otros_costes,
      porcentaje_beneficio,
      precio_sin_descuento,
      precio_final,
      descuento_aplicado,
      motivo_descuento,
      elementos,
    } = req.body;

    //empresa_id se toma del JWT, no del body, para evitar crear presupuestos
    //en otras empresas.
    const empresa_id = empresaIdEfectivo(req);

    // Validaciones
    if (!empresa_id || !cliente_id || !usuario_id || !numero_presupuesto) {
      await transaccion.rollback();
      return res
        .status(400)
        .json({
          message:
            "Faltan campos obligatorios (cliente_id, usuario_id, numero_presupuesto)",
        });
    }

    //El cliente al que se asocia el presupuesto debe ser de la propia empresa.
    const clienteRel = await Cliente.findByPk(cliente_id, { transaction: transaccion });
    if (!clienteRel || String(clienteRel.empresa_id) !== String(empresa_id)) {
      await transaccion.rollback();
      return res.status(400).json({ message: "Cliente invalido para esta empresa" });
    }

    // 1. Crear cabecera
    const nuevoPresupuesto = await Presupuesto.create(
      {
        empresa_id,
        usuario_id,
        cliente_id,
        numero_presupuesto,
        version: 1,
        estado: estado || "borrador",
        notas_internas: notas_internas || null,
        notas_cliente: notas_cliente || null,
        valido_hasta: valido_hasta || null,
        coste_materiales: coste_materiales || 0,
        coste_mano_obra: coste_mano_obra || 0,
        otros_costes: otros_costes || 0,
        porcentaje_beneficio: porcentaje_beneficio || 0,
        precio_sin_descuento: precio_sin_descuento || 0,
        precio_final: precio_final || 0,
        descuento_aplicado: descuento_aplicado || 0,
        motivo_descuento: motivo_descuento || null,
      },
      { transaction: transaccion },
    );

    // 2. Crear elementos y sus materiales
    if (elementos && elementos.length > 0) {
      for (let i = 0; i < elementos.length; i++) {
        const el = elementos[i];

        if (!el.descripcion || el.cantidad === undefined) {
          await transaccion.rollback();
          return res.status(400).json({
            message: "Cada elemento debe tener descripción y cantidad",
          });
        }

        const nuevoElemento = await Elemento.create(
          {
            presupuesto_id: nuevoPresupuesto.id,
            descripcion: el.descripcion,
            cantidad: el.cantidad,
            medida_ancho: el.medida_ancho || 1,
            medida_alto: el.medida_alto || 1,
            tiempo_estimado_minutos: el.tiempo_estimado_minutos || 0,
            notas_fabricacion: el.notas_fabricacion || null,
            coste_linea: el.coste_linea || 0,
            orden: i,
          },
          { transaction: transaccion },
        );

        if (el.materiales_desglose && el.materiales_desglose.length > 0) {
          for (const mat of el.materiales_desglose) {
            if (!mat.material_id || mat.cantidad_calculada === undefined) {
              await transaccion.rollback();
              return res.status(400).json({
                message:
                  "Faltan datos (ID o cantidad) en los materiales del desglose",
              });
            }

            await ElementoMaterial.create(
              {
                elemento_id: nuevoElemento.id,
                material_id: mat.material_id,
                nombre_material_snapshot:
                  mat.nombre_material_snapshot || "Material",
                cantidad_calculada: mat.cantidad_calculada,
                precio_congelado: mat.precio_congelado || 0,
                coste_total: (mat.cantidad_calculada || 0) * (mat.precio_congelado || 0),
              },
              { transaction: transaccion },
            );
          }
        }
      }
    }

    await transaccion.commit();
    res.status(201).json(nuevoPresupuesto);
  } catch (error) {
    await transaccion.rollback();
    logger.error("createPresupuesto", error);
    res.status(500).json({ message: "Error al crear el presupuesto" });
  }
};

// ACTUALIZAR PRESUPUESTO
export const updatePresupuesto = async (req, res) => {
  const transaccion = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      cliente_id,
      estado,
      notas_internas,
      notas_cliente,
      valido_hasta,
      coste_materiales,
      coste_mano_obra,
      otros_costes,
      porcentaje_beneficio,
      precio_sin_descuento,
      precio_final,
      descuento_aplicado,
      motivo_descuento,
      elementos,
    } = req.body;

    const presupuesto = await Presupuesto.findByPk(id, {
      transaction: transaccion,
    });

    if (!presupuesto) {
      await transaccion.rollback();
      return res.status(404).json({ message: "Presupuesto no encontrado" });
    }

    //Tenant: el presupuesto debe pertenecer a la empresa del JWT.
    //Hacemos el chequeo a mano (en vez de assertOwnsRecurso) porque tenemos
    //transaccion abierta y hay que rollbackearla antes de responder.
    if (
      req.user?.rol !== "superadmin" &&
      String(presupuesto.empresa_id) !== String(req.user.empresa_id)
    ) {
      await transaccion.rollback();
      return res.status(404).json({ message: "Presupuesto no encontrado" });
    }

    //Si llega cliente_id en el body, validamos que el cliente sea de la misma empresa.
    if (cliente_id) {
      const clienteRel = await Cliente.findByPk(cliente_id, {
        transaction: transaccion,
      });
      if (
        !clienteRel ||
        String(clienteRel.empresa_id) !== String(presupuesto.empresa_id)
      ) {
        await transaccion.rollback();
        return res
          .status(400)
          .json({ message: "Cliente invalido para esta empresa" });
      }
    }

    // 1. Actualizar datos de cabecera
    await presupuesto.update(
      {
        cliente_id,
        estado,
        notas_internas,
        notas_cliente,
        valido_hasta,
        coste_materiales,
        coste_mano_obra,
        otros_costes,
        porcentaje_beneficio,
        precio_sin_descuento,
        precio_final,
        descuento_aplicado,
        motivo_descuento,
        version: (presupuesto.version || 1) + 1,
        fecha_actualizacion: new Date(),
      },
      { transaction: transaccion },
    );

    // 2. Si vienen elementos, se reemplazan los antiguos por los nuevos
    if (elementos) {
      // Buscar elementos actuales
      const elementosActuales = await Elemento.findAll({
        where: { presupuesto_id: id },
        transaction: transaccion,
      });

      const idsElementos = elementosActuales.map((e) => e.id);

      // Eliminar historial viejo (primero hijos, luego padres)
      if (idsElementos.length > 0) {
        await ElementoMaterial.destroy({
          where: { elemento_id: idsElementos },
          transaction: transaccion,
        });
        await Elemento.destroy({
          where: { presupuesto_id: id },
          transaction: transaccion,
        });
      }

      // Insertar la nueva configuración de elementos
      for (let i = 0; i < elementos.length; i++) {
        const el = elementos[i];

        if (!el.descripcion || el.cantidad === undefined) {
          await transaccion.rollback();
          return res
            .status(400)
            .json({
              message: "Hay elementos sin descripción o cantidad definidos",
            });
        }

        const nuevoElemento = await Elemento.create(
          {
            presupuesto_id: id,
            descripcion: el.descripcion,
            cantidad: el.cantidad,
            medida_ancho: el.medida_ancho || 1,
            medida_alto: el.medida_alto || 1,
            tiempo_estimado_minutos: el.tiempo_estimado_minutos || 0,
            notas_fabricacion: el.notas_fabricacion || null,
            coste_linea: el.coste_linea || 0,
            orden: i,
          },
          { transaction: transaccion },
        );

        if (el.materiales_desglose && el.materiales_desglose.length > 0) {
          for (const mat of el.materiales_desglose) {
            // Validación de seguridad para que el array venga bien formado
            if (!mat.material_id) continue;

            await ElementoMaterial.create(
              {
                elemento_id: nuevoElemento.id,
                material_id: mat.material_id,
                nombre_material_snapshot:
                  mat.nombre_material_snapshot || "Material",
                cantidad_calculada: mat.cantidad_calculada || 0,
                precio_congelado: mat.precio_congelado || 0,
                coste_total: (mat.cantidad_calculada || 0) * (mat.precio_congelado || 0),
              },
              { transaction: transaccion },
            );
          }
        }
      }
    }

    await transaccion.commit();
    res.status(200).json({ message: "Presupuesto actualizado correctamente" });
  } catch (error) {
    await transaccion.rollback();
    logger.error("updatePresupuesto", error);
    res.status(500).json({ message: "Error al actualizar el presupuesto" });
  }
};
