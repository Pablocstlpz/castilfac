"use strict";
import { Material } from "../models/material.model.js";
import { Categoria } from "../models/categoria.model.js";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";

export const obtenerMaterialesConPrecioEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    //obtengo materiales, categorias y precios de empresa en paralelo
    const [materiales, categorias, preciosEmpresa] = await Promise.all([
      Material.findAll(),
      Categoria.findAll(),
      PrecioEmpresa.findAll({ where: { empresa_id } }),
    ]);

    //si no hay materiales devuelvo 404
    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ error: "No se encontraron materiales" });
    }

    //enriquezco cada material con su categoria y precio de empresa
    const resultado = materiales.map((m) => {
      const mPlano = m.toJSON();
      const cat = categorias.find((c) => c.id === mPlano.categoria_id);
      const precio = preciosEmpresa.find((p) => p.material_id === mPlano.id);
      return {
        ...mPlano,
        categoria_nombre: cat ? cat.nombre : "—",
        precio_venta: precio ? precio.precio_venta : mPlano.precio_base,
        porcentaje_merma: precio ? precio.porcentaje_merma : (mPlano.porcentaje_merma_recomendado ?? 0),
      };
    });

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al obtener materiales con precio de empresa:", error);
    res.status(500).json({ error: "Error al obtener materiales con precio de empresa" });
  }
};

export const obtenerMateriales = async (req, res) => {
  try {
    //obtener todos los materiales de la base de datos
    const materiales = await Material.findAll();

    //validar que el resultado no sea nulo o vacío
    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ error: "No se encontraron materiales" });
    }

    //si hay datos, envio el resultado como JSON
    res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: "Error al obtener materiales" });
  }
};

export const obtenerMaterialPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    res.status(200).json(material);
  } catch (error) {
    console.error("Error al obtener material por ID:", error);
    res.status(500).json({ error: "Error al obtener material por ID" });
  }
};

export const toggleActivoMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    await material.update({ activo: !material.activo });

    res.status(200).json(material);
  } catch (error) {
    console.error("Error al cambiar estado del material:", error);
    res.status(500).json({ error: "Error al cambiar estado del material" });
  }
};

export const crearMaterial = async (req, res) => {
  try {
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
    } = req.body;

    const material = await Material.create({
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
    });

    res.status(201).json(material);
  } catch (error) {
    console.error("Error al crear material:", error);
    res.status(500).json({ error: "Error al crear material" });
  }
};

export const actualizarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: "Material no encontrado" });
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
    res.status(500).json({ error: "Error al actualizar material" });
  }
};

export const eliminarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Material.findByPk(id);

    if (!material) {
      return res.status(404).json({ error: "Material no encontrado" });
    }

    await material.update({ deleted_at: new Date() });

    res.status(200).json({ message: "Material eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ error: "Error al eliminar material" });
  }
};
