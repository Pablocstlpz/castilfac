"use strict";
import { Material } from "../models/material.model.js";
import { Categoria } from "../models/categoria.model.js";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";
import { HistorialPrecioBase } from "../models/historialPrecioBase.model.js";
import { sequelize } from "../data/db.js";
import { assertEmpresaIdParam } from "../utils/tenant.js";

//funcion para obtener los materiales de una empresa enriquecidos con su categoria y su precio empresa
//esto es lo que pide el catalogo para mostrar el listado completo
export const obtenerMaterialesConPrecioEmpresa = async (req, res) => {
  try {
    //el empresa_id de la URL debe coincidir con el del JWT
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const { empresa_id } = req.params;

    //hago las 3 peticiones en paralelo con Promise.all para que cargue mas rapido
    const [materiales, categorias, preciosEmpresa] = await Promise.all([
      Material.findAll({ where: { empresa_id, deleted_at: null } }),
      Categoria.findAll(),
      PrecioEmpresa.findAll({ where: { empresa_id } }),
    ]);

    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ message: "No se encontraron materiales" });
    }

    //junto los 3 arrays en un solo objeto por material para que el frontend no tenga que hacer joins
    const resultado = materiales.map((m) => {
      const mPlano = m.toJSON();
      const cat = categorias.find((c) => c.id === mPlano.categoria_id);
      const precio = preciosEmpresa.find((p) => p.material_id === mPlano.id);
      return {
        ...mPlano,
        categoria_nombre: cat ? cat.nombre : "—",
        //si la empresa no tiene precio propio para este material uso el precio base
        precio_venta: precio ? precio.precio_venta : mPlano.precio_base,
        porcentaje_merma: precio ? precio.porcentaje_merma : (mPlano.porcentaje_merma_recomendado ?? 0),
      };
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener materiales con precio de empresa:", error);
    res.status(500).json({ message:"Error al obtener materiales con precio de empresa" });
  }
};

//funcion para obtener los materiales base de una empresa (lista plana, sin enriquecer)
//util para los select de los formularios
export const obtenerMateriales = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;
    const { empresa_id } = req.params;

    const materiales = await Material.findAll({ where: { empresa_id, deleted_at: null } });

    //lista vacia -> 200 + [] para que el frontend no falle
    res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ message:"Error al obtener materiales" });
  }
};

//funcion para obtener un material por su id (filtrado por empresa)
export const obtenerMaterialPorId = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;
    const { empresa_id, id } = req.params;

    //busco el material por id y empresa para que un usuario no pueda leer materiales de otra empresa
    const material = await Material.findOne({ where: { id, empresa_id } });

    if (!material) {
      return res.status(404).json({ message:"Material no encontrado" });
    }

    res.status(200).json(material);
  } catch (error) {
    console.error("Error al obtener material por ID:", error);
    res.status(500).json({ message:"Error al obtener material por ID" });
  }
};

//funcion para activar o desactivar un material (cambio el activo al opuesto)
export const toggleActivoMaterial = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

    if (!material) {
      return res.status(404).json({ message:"Material no encontrado" });
    }

    //invierto el valor de activo
    await material.update({ activo: !material.activo });

    res.status(200).json(material);
  } catch (error) {
    console.error("Error al cambiar estado del material:", error);
    res.status(500).json({ message:"Error al cambiar estado del material" });
  }
};

//funcion para crear un material nuevo
//uso transaccion porque tambien tengo que crear el registro inicial en historial_precios_base
export const crearMaterial = async (req, res) => {
  let transaccion;
  try {
    transaccion = await sequelize.transaction();
    if (!assertEmpresaIdParam(req, res, "empresa_id")) {
      await transaccion.rollback();
      return;
    }
    const { empresa_id } = req.params;

    const {
      categoria_id,
      codigo_interno,
      nombre,
      descripcion,
      tipo_unidad,
      precio_base,
      porcentaje_merma_recomendado,
      proveedor,
      referencia_proveedor,
      atributos_extra,
      imagen_url,
      usuario_id,
    } = req.body;

    const idUsuarioCreador = usuario_id ?? null;

    //creo el material en la BD
    const nuevoMaterial = await Material.create(
      {
        empresa_id,
        categoria_id,
        codigo_interno,
        nombre,
        descripcion,
        tipo_unidad,
        precio_base,
        porcentaje_merma_recomendado,
        proveedor,
        referencia_proveedor,
        atributos_extra,
        imagen_url,
      },
      { transaction: transaccion },
    );

    //creo el registro inicial en el historial de precios base
    await HistorialPrecioBase.create(
      {
        material_id: nuevoMaterial.id,
        precio_anterior: 0,
        precio_nuevo: precio_base,
        usuario_admin_id: idUsuarioCreador,
        motivo: "Registro inicial del material",
      },
      { transaction: transaccion },
    );

    //todo bien, hago commit
    await transaccion.commit();

    res.status(201).json(nuevoMaterial);
  } catch (error) {
    //si algo falla hago rollback para no dejar el material sin su historial inicial
    if (transaccion) await transaccion.rollback();
    console.error("Error al crear material:", error);
    res.status(500).json({ message: "Error al crear material" });
  }
};

//funcion para actualizar un material existente
export const actualizarMaterial = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

    if (!material) {
      return res.status(404).json({ message:"Material no encontrado" });
    }

    const {
      categoria_id,
      codigo_interno,
      nombre,
      descripcion,
      tipo_unidad,
      precio_base,
      porcentaje_merma_recomendado,
      proveedor,
      referencia_proveedor,
      atributos_extra,
      imagen_url,
      activo,
    } = req.body;

    await material.update({
      categoria_id,
      codigo_interno,
      nombre,
      descripcion,
      tipo_unidad,
      precio_base,
      porcentaje_merma_recomendado,
      proveedor,
      referencia_proveedor,
      atributos_extra,
      imagen_url,
      activo,
      fecha_actualizacion: new Date(),
    });

    res.status(200).json(material);
  } catch (error) {
    console.error("Error al actualizar material:", error);
    res.status(500).json({ message:"Error al actualizar material" });
  }
};

//funcion para eliminar un material (borrado logico, le pongo deleted_at)
export const eliminarMaterial = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

    if (!material) {
      return res.status(404).json({ message:"Material no encontrado" });
    }

    //borrado logico: pongo deleted_at en la fecha actual para que las queries lo filtren
    await material.update({ deleted_at: new Date() });

    res.status(200).json({ message: "Material eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ message:"Error al eliminar material" });
  }
};
