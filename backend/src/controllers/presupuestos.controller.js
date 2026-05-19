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

//funcion para cambiar solo el estado de un presupuesto (lo uso desde el detalle)
const ESTADOS_PRESUPUESTO = ["borrador", "enviado", "aprobado", "rechazado", "caducado"];

export const patchEstadoPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_PRESUPUESTO.includes(estado)) {
      return res.status(400).json({
        message: `Estado inválido. Valores permitidos: ${ESTADOS_PRESUPUESTO.join(", ")}`,
      });
    }

    const presupuesto = await Presupuesto.findByPk(id);
    //el presupuesto debe pertenecer a la empresa del JWT
    if (!assertOwnsRecurso(req, res, presupuesto)) return;

    await presupuesto.update({ estado, fecha_actualizacion: new Date() });
    res.status(200).json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("[patchEstadoPresupuesto] error:", error);
    res.status(500).json({ message: "Error al actualizar el estado" });
  }
};

//funcion para obtener un presupuesto completo con sus elementos y materiales asociados
//es el endpoint mas complejo del controller porque devuelve toda la estructura para el detalle
export const getPresupuestoById = async (req, res) => {
  try {
    const { id } = req.params;

    const presupuesto = await Presupuesto.findByPk(id);
    //compruebo que el presupuesto pertenezca a mi empresa antes de devolverlo
    if (!assertOwnsRecurso(req, res, presupuesto)) return;

    //busco el cliente para mostrar su nombre en el detalle
    const cliente = await Cliente.findByPk(presupuesto.cliente_id, {
      attributes: ["nombre_empresa_o_particular"],
    });

    //cargo los elementos del presupuesto ordenados por su campo orden
    const elementosRaw = await Elemento.findAll({
      where: { presupuesto_id: id },
      order: [["orden", "ASC"]],
    });

    const elementoIds = elementosRaw.map((e) => e.id);

    let elementosMaterialesRaw = [];
    let materiales = [];

    //si hay elementos cargo sus desgloses de materiales con una sola query (Op.in)
    if (elementoIds.length > 0) {
      elementosMaterialesRaw = await ElementoMaterial.findAll({
        where: { elemento_id: { [Op.in]: elementoIds } },
      });

      //saco la lista unica de material_id para hacer una sola query a Material
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

    //monto un mapa { material_id: material } para poder buscar rapido despues
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

//funcion para obtener todos los presupuestos de una empresa
export const getPresupuestos = async (req, res) => {
  try {
    //el :id es el empresa_id (la ruta es /empresas/:id/presupuestos)
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const { id } = req.params;
    const presupuestos = await Presupuesto.findAll({
      where: { empresa_id: id },
    });

    //si no hay presupuestos devuelvo array vacio con 200 para que el frontend no falle
    res.status(200).json(presupuestos);
  } catch (error) {
    console.error("[getPresupuestos] error:", error);
    res.status(500).json({ message: "Error al obtener los presupuestos" });
  }
};

//funcion para crear un presupuesto con todos sus elementos y materiales en una transaccion
//si falla cualquier paso hago rollback y no queda nada a medias en la BD
export const createPresupuesto = async (req, res) => {
  let transaccion;
  try {
    transaccion = await sequelize.transaction();
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

    //el empresa_id se coge del JWT no del body, asi nadie crea presupuestos en otra empresa
    const empresa_id = empresaIdEfectivo(req);

    //valido que esten los campos obligatorios
    if (!empresa_id || !cliente_id || !usuario_id || !numero_presupuesto) {
      await transaccion.rollback();
      return res
        .status(400)
        .json({
          message:
            "Faltan campos obligatorios (cliente_id, usuario_id, numero_presupuesto)",
        });
    }

    //el cliente al que asocio el presupuesto debe ser de la propia empresa
    const clienteRel = await Cliente.findByPk(cliente_id, { transaction: transaccion });
    if (!clienteRel || String(clienteRel.empresa_id) !== String(empresa_id)) {
      await transaccion.rollback();
      return res.status(400).json({ message: "Cliente invalido para esta empresa" });
    }

    //1. creo la cabecera del presupuesto
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

    //2. creo los elementos y sus materiales asociados (uno a uno con orden)
    if (elementos && elementos.length > 0) {
      for (let i = 0; i < elementos.length; i++) {
        const el = elementos[i];

        //compruebo que cada elemento tenga descripcion y cantidad
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
    if (transaccion) await transaccion.rollback();
    logger.error("createPresupuesto", error);
    res.status(500).json({ message: "Error al crear el presupuesto" });
  }
};

//funcion para actualizar un presupuesto entero, cabecera + elementos + materiales
//tambien en transaccion porque si falla algo no quiero dejar elementos huerfanos
export const updatePresupuesto = async (req, res) => {
  let transaccion;
  try {
    transaccion = await sequelize.transaction();
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

    //compruebo tenant a mano (no uso assertOwnsRecurso porque tengo transaccion abierta y necesito hacer rollback antes de responder)
    //devuelvo 404 en vez de 403 para no filtrar la existencia del id ajeno
    if (
      req.user?.rol !== "superadmin" &&
      String(presupuesto.empresa_id) !== String(req.user.empresa_id)
    ) {
      await transaccion.rollback();
      return res.status(404).json({ message: "Presupuesto no encontrado" });
    }

    //si llega cliente_id en el body, valido que ese cliente sea de la misma empresa
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

    //1. actualizo los datos de cabecera y subo la version del presupuesto
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

    //2. si vienen elementos en el body, reemplazo los antiguos por los nuevos (borro todos y vuelvo a crear)
    if (elementos) {
      //busco los elementos actuales del presupuesto
      const elementosActuales = await Elemento.findAll({
        where: { presupuesto_id: id },
        transaction: transaccion,
      });

      const idsElementos = elementosActuales.map((e) => e.id);

      //borro primero los hijos (materiales de cada elemento) y luego los padres (elementos)
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

      //inserto la nueva configuracion de elementos uno a uno con su orden
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
            //si el item viene mal formado lo salto para no petar el insert
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
    if (transaccion) await transaccion.rollback();
    logger.error("updatePresupuesto", error);
    res.status(500).json({ message: "Error al actualizar el presupuesto" });
  }
};
