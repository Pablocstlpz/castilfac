"use strict";
import { Categoria } from "../models/categoria.model.js";

export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();

    //valido que no haya ninguna categoria
    if (categorias.length === 0) {
      return res.status(404).json({ message: "No se encontraron categorias" });
    }

    // Si todo va bien, devuelvo las categorias
    res.status(200).json(categorias);
  } catch (error) {
    // si ocurre algun error
    //doy el error
    res.status(500).json({ message: error.message });
  }
};

export const getCategoria = async (req, res) => {
  try {
    const idCategoria = req.params.id;

    //busco en la tabla por este id
    const categoria = await Categoria.findByPk(idCategoria);

    //valido que no sea 0
    if (!categoria) {
      return res.status(404).json({ message: "No se encontro la categoria" });
    }

    //si hay dato lo devuelvo
    res.status(200).json(categoria);
  } catch (error) {
    //doy el error
    res.status(500).json({ message: error.message });
  }
};
