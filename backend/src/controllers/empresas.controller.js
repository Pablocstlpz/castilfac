import { Empresa } from "../models/empresa.model.js";
import { Op } from "sequelize";
import { sequelize } from "../data/db.js";
import { Usuario } from "../models/usuario.model.js";

export const getEmpresas = async (req, res) => {
  try {
    //busco todas las empresas
    const empresas = await Empresa.findAll();

    //valido que haya empresas, si no hay digo que no hay
    if (empresas.length === 0) {
      return res.status(404).json({ message: "No hay empresas" });
    }

    //devuelvo las empresas
    res.status(200).json(empresas);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener las empresas" });
  }
};

export const getEmpresa = async (req, res) => {
  try {
    //recojo el id de la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "La empresa no existe" });
    }

    //devuelvo la empresa
    res.status(200).json(empresa);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener la empresa" });
  }
};

export const getEmpresaByNif = async (req, res) => {
  try {
    //recojo el nif de la URL (puede venir en mayúsculas o minúsculas)
    const { nif } = req.params;

    if (!nif) {
      return res.status(400).json({ message: "El NIF es requerido" });
    }

    if (!/^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/.test(nif)) {
      return res.status(400).json({ message: "El NIF debe ser un NIF válido" });
    }

    const nifMayusculas = nif.toUpperCase();

    //busco la empresa por el nif
    const empresa = await Empresa.findOne({
      where: { nif: nifMayusculas },
    });

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "La empresa no existe" });
    }

    //devuelvo la empresa
    res.status(200).json(empresa);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener la empresa por NIF" });
  }
};

export const createEmpresa = async (req, res) => {
  try {
    //recojo los datos del body
    const {
      nombre_comercial,
      razon_social,
      nif,
      email,
      telefono,
      direccion,
      codigo_postal,
      ciudad,
      provincia,
      logo_url,
      fecha_vencimiento,
      suscripcion_activa,
      activo,
    } = req.body;

    //valido que todos los campos sean requeridos
    if (
      !nombre_comercial ||
      !razon_social ||
      !nif ||
      !email ||
      !telefono ||
      !direccion ||
      !codigo_postal ||
      !ciudad ||
      !provincia
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    //valido que el email sea un email valido
    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "El email debe ser un email valido" });
    }

    //valido que el nif sea un CIF válido de empresa
    const nifMayusculas = nif.toUpperCase();
    // CIF: letra inicial + 7 dígitos + dígito o letra final
    if (!/^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/.test(nifMayusculas)) {
      return res
        .status(400)
        .json({ message: "El CIF debe ser un CIF válido de empresa" });
    }

    //valido que el telefono sea un telefono valido
    if (!telefono.match(/^\+?[1-9]\d{6,14}$/)) {
      return res
        .status(400)
        .json({ message: "El telefono debe ser un telefono valido" });
    }

    //valido que el codigo postal sea un codigo postal valido
    if (!codigo_postal.match(/^[0-9]{5}$/)) {
      return res
        .status(400)
        .json({ message: "El codigo postal debe ser un codigo postal valido" });
    }

    //valido que la ciudad sea una ciudad valida
    if (!ciudad.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)) {
      return res
        .status(400)
        .json({ message: "La ciudad debe ser una ciudad valida" });
    }

    //valido que la provincia sea una provincia valida
    if (!provincia.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)) {
      return res
        .status(400)
        .json({ message: "La provincia debe ser una provincia valida" });
    }

    //valido que el email no este registrado en la empresa
    const existeEmpresa = await Empresa.findOne({
      where: { email: email },
    });
    if (existeEmpresa) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //valido que el email no este registrado en algun usuario
    const existeUsuario = await Usuario.findOne({
      where: { email: email },
    });
    if (existeUsuario) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //valido que el nif no este registrado en la empresa
    const existeEmpresaNif = await Empresa.findOne({
      where: { nif: nifMayusculas },
    });
    if (existeEmpresaNif) {
      return res.status(400).json({ message: "El NIF ya esta registrado" });
    }

    //valido que el telefono no lo tenga otra empresa
    const existeEmpresaTelefono = await Empresa.findOne({
      where: { telefono: telefono },
    });
    if (existeEmpresaTelefono) {
      return res
        .status(400)
        .json({ message: "El telefono ya esta registrado" });
    }

    // Si no viene fecha_vencimiento, usar hoy + 14 días (prueba gratis)
    const fechaVencimiento = fecha_vencimiento
      ? new Date(fecha_vencimiento)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    //creo la empresa
    const empresa = await Empresa.create({
      nombre_comercial: nombre_comercial,
      razon_social: razon_social,
      nif: nifMayusculas,
      email: email,
      telefono: telefono,
      direccion: direccion,
      codigo_postal: codigo_postal,
      ciudad: ciudad,
      provincia: provincia,
      fecha_vencimiento: fechaVencimiento,
      suscripcion_activa: suscripcion_activa ?? false,
      activo: activo ?? true,
    });

    //devuelvo la empresa creada
    res.status(200).json(empresa);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al crear la empresa" });
  }
};

export const updateEmpresa = async (req, res) => {
  try {
    //recojo el id de la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //busco la empresa por el id
    const empresaExiste = await Empresa.findByPk(id);

    //valido que la empresa exista
    if (!empresaExiste) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //recojo los datos del body
    const {
      nombre_comercial,
      razon_social,
      nif,
      email,
      telefono,
      direccion,
      codigo_postal,
      ciudad,
      provincia,
      suscripcion_activa,
      fecha_vencimiento,
      activo,
      logo_url,
    } = req.body;

    //valido que el email sea un email valido
    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "El email debe ser un email valido" });
    }

    //valido que el nif sea un CIF válido de empresa
    const nifUpperUpdate = nif.toUpperCase();
    if (!/^[A-HJNP-SUVW][0-9]{7}[0-9A-J]$/.test(nifUpperUpdate)) {
      return res
        .status(400)
        .json({ message: "El CIF debe ser un CIF válido de empresa" });
    }

    // comprobar que el email no está usado por OTRA empresa distinta
    const existeEmpresa = await Empresa.findOne({
      where: {
        email: email,
        id: { [Op.ne]: id }, //excluye a la propia empresa
      },
    });

    //valido que el email no este registrado
    if (existeEmpresa) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //valido que el email no este registrado en algun usuario
    const existeUsuario = await Usuario.findOne({
      where: { email: email },
    });
    if (existeUsuario) {
      return res
        .status(400)
        .json({ message: "El email ya esta registrado en un usuario" });
    }

    //valido que el nif no este registrado en la empresa
    const existeEmpresaNif = await Empresa.findOne({
      where: {
        nif: nifUpperUpdate,
        id: { [Op.ne]: id }, //excluye a la propia empresa
      },
    });
    if (existeEmpresaNif) {
      return res
        .status(400)
        .json({ message: "El NIF ya esta registrado en la empresa" });
    }

    //valido que el telefono no lo tenga otra empresa
    const existeEmpresaTelefono = await Empresa.findOne({
      where: {
        telefono: telefono,
        id: { [Op.ne]: id }, //excluye a la propia empresa
      },
    });
    if (existeEmpresaTelefono) {
      return res
        .status(400)
        .json({ message: "El telefono ya esta registrado" });
    }

    //valido que el telefono sea un telefono valido
    if (!telefono.match(/^\+?[1-9]\d{6,14}$/)) {
      return res
        .status(400)
        .json({ message: "El telefono debe ser un telefono valido" });
    }

    //valido que el codigo postal sea un codigo postal valido
    if (!codigo_postal.match(/^[0-9]{5}$/)) {
      return res
        .status(400)
        .json({ message: "El codigo postal debe ser un codigo postal valido" });
    }

    //valido que la ciudad sea una ciudad valida
    if (!ciudad.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)) {
      return res
        .status(400)
        .json({ message: "La ciudad debe ser una ciudad valida" });
    }

    //valido que la provincia sea una provincia valida
    if (!provincia.match(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)) {
      return res
        .status(400)
        .json({ message: "La provincia debe ser una provincia valida" });
    }

    //actualizo la empresa
    const empresaActualizada = await empresaExiste.update({
      nombre_comercial: nombre_comercial,
      razon_social: razon_social,
      nif: nifUpperUpdate,
      email: email,
      telefono: telefono,
      direccion: direccion,
      codigo_postal: codigo_postal,
      ciudad: ciudad,
      provincia: provincia,
      suscripcion_activa: suscripcion_activa,
      fecha_vencimiento: fecha_vencimiento,
      activo: activo,
      fecha_actualizacion: new Date(),
      logo_url: logo_url,
    });

    //devuelvo la empresa actualizada
    res.status(200).json(empresaActualizada);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al actualizar la empresa" });
  }
};

export const deleteEmpresa = async (req, res) => {
  try {
    //recojo el id de la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //busco la empresa por el id
    const empresaExiste = await Empresa.findByPk(id);

    //valido que la empresa exista
    if (!empresaExiste) {
      return res.status(404).json({ message: "La empresa no existe" });
    }

    //elimino la empresa
    await empresaExiste.destroy();

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Empresa eliminada correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al eliminar la empresa" });
  }
};

export const deleteEmpresaCorreo = async (req, res) => {
  try {
    const { correo } = req.params;

    //valido que el correo sea requerido
    if (!correo) {
      return res.status(400).json({ message: "El correo es requerido" });
    }

    //busco la empresa por el correo
    const empresa = await Empresa.findOne({
      where: { email: correo },
    });

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "La empresa no existe" });
    }

    //elimino la empresa
    await empresa.destroy();

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Empresa eliminada correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al eliminar la empresa por correo" });
  }
};
