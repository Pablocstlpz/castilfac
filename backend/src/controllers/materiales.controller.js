"use strict";
import { Material } from "../models/material.model.js";
import { Categoria } from "../models/categoria.model.js";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";
import { HistorialPrecioBase } from "../models/historialPrecioBase.model.js";
import { sequelize } from "../data/db.js";

export const obtenerMaterialesConPrecioEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    const [materiales, categorias, preciosEmpresa] = await Promise.all([
      Material.findAll({ where: { empresa_id, deleted_at: null } }),
      Categoria.findAll(),
      PrecioEmpresa.findAll({ where: { empresa_id } }),
    ]);

    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ error: "No se encontraron materiales" });
    }

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
    const { empresa_id } = req.params;

    const materiales = await Material.findAll({ where: { empresa_id, deleted_at: null } });

    if (!materiales || materiales.length === 0) {
      return res.status(404).json({ error: "No se encontraron materiales" });
    }

    res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ error: "Error al obtener materiales" });
  }
};

export const obtenerMaterialPorId = async (req, res) => {
  try {
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

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
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

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
  const transaccion = await sequelize.transaction();

  try {
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

    await transaccion.commit();

    res.status(201).json(nuevoMaterial);
  } catch (error) {
    await transaccion.rollback();
    console.error("Error al crear material:", error);
    res.status(500).json({ error: "Error al crear material" });
  }
};

export const actualizarMaterial = async (req, res) => {
  try {
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

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
    const { empresa_id, id } = req.params;

    const material = await Material.findOne({ where: { id, empresa_id } });

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
