import { Empresa } from "../models/empresa.model.js";
import { Op } from "sequelize";
import { sequelize } from "../data/db.js";
import { Usuario } from "../models/usuario.model.js";
import { randomUUID } from "crypto";
import { enviarEmailVerificacion } from "../mailer.js";
import { URL, FRONTEND_URL } from "../config.js";
import { hashPassword } from "../utils/seguridad.js";
import { logger } from "../utils/logger.js";

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
    //NOTA DE SEGURIDAD: NO se aceptan del body:
    //  - suscripcion_activa, fecha_vencimiento  (solo los toca el flujo de Stripe)
    //  - activo                                  (solo lo toca un superadmin)
    //  - email_verificado, token_verificacion    (solo el flujo de verificacion por email)
    //Asi evitamos que un cliente se de de alta con suscripcion premium ya activada.
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
    } = req.body;

    //Las validaciones de formato (campos requeridos, regex de CIF/telefono/CP,
    //caracteres de ciudad/provincia, email valido, longitudes) las hace ahora
    //el middleware validarCrearEmpresa antes de llegar aqui. Mantenemos en este
    //controller solo las REGLAS DE NEGOCIO (unicidad, side effects).
    const nifMayusculas = nif.toUpperCase();

    // Si existe alguna empresa no verificada con el mismo NIF, email o teléfono,
    // la elimino junto a sus usuarios para permitir que el usuario pueda reintentar el registro
    const empresasNoVerificadas = await Empresa.findAll({
      where: {
        email_verificado: false,
        [Op.or]: [
          { nif: nifMayusculas },
          { email: email },
          { telefono: telefono },
        ],
      },
    });
    for (const emp of empresasNoVerificadas) {
      await Usuario.destroy({ where: { empresa_id: emp.id } });
      await emp.destroy();
    }

    //valido que el email no este registrado en una empresa ya verificada
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

    //valido que el nif no este registrado en una empresa ya verificada
    const existeEmpresaNif = await Empresa.findOne({
      where: { nif: nifMayusculas },
    });
    if (existeEmpresaNif) {
      return res.status(400).json({ message: "El NIF ya esta registrado" });
    }

    //valido que el telefono no lo tenga otra empresa ya verificada
    const existeEmpresaTelefono = await Empresa.findOne({
      where: { telefono: telefono },
    });
    if (existeEmpresaTelefono) {
      return res
        .status(400)
        .json({ message: "El telefono ya esta registrado" });
    }

    //la fecha de vencimiento se calcula SIEMPRE en el servidor: hoy + 14 dias (prueba gratis)
    //el cliente no puede ya extenderla.
    const fechaVencimiento = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    //genero el token de verificación
    const token = randomUUID();

    //creo la empresa con valores controlados por el servidor.
    //suscripcion_activa se queda en false y solo el flujo de Stripe la pone a true.
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
      logo_url: logo_url,
      fecha_vencimiento: fechaVencimiento,
      suscripcion_activa: false,
      activo: true,
      email_verificado: false,
      token_verificacion: token,
    });

    //envío el email de verificación sin bloquear la respuesta
    const urlVerificacion = `${URL}/api/empresas/verificar/${token}`;
    enviarEmailVerificacion(email, nombre_comercial, urlVerificacion);

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
    //SEGURIDAD: SOLO leemos del body los campos editables por la empresa.
    //suscripcion_activa, fecha_vencimiento, activo, email_verificado y token_verificacion
    //los gestiona el servidor (flujo Stripe, verificacion de email, superadmin),
    //por lo que NO se aceptan del cliente -> evita escalada de privilegios via PUT.
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
    } = req.body;

    //Las validaciones de formato las hace validarActualizarEmpresa antes del controller.
    //Aqui solo aplicamos reglas de negocio: unicidad de email/NIF/telefono entre empresas.
    const nifUpperUpdate = nif.toUpperCase();

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

    //actualizo SOLO los campos editables por la empresa.
    //Los campos de suscripcion (suscripcion_activa, fecha_vencimiento), de estado (activo)
    //y de verificacion (email_verificado, token_verificacion) NO se tocan aqui:
    //solo los gestionan Stripe, el flujo de verificacion de email o un superadmin.
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
      logo_url: logo_url,
      fecha_actualizacion: new Date(),
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

export const verificarEmailEmpresa = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token requerido" });
    }

    const empresa = await Empresa.findOne({ where: { token_verificacion: token } });

    if (!empresa) {
      return res.redirect(`${FRONTEND_URL}/login`);
    }

    await empresa.update({
      email_verificado: true,
      token_verificacion: null,
    });

    return res.redirect(`${FRONTEND_URL}/verificacion-exito`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al verificar el email de la empresa" });
  }
};

export const reenviarVerificacionEmpresa = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email es requerido" });
    }

    const empresa = await Empresa.findOne({ where: { email } });

    if (!empresa) {
      return res.status(404).json({ message: "No existe ninguna empresa con ese email" });
    }

    if (empresa.email_verificado) {
      return res.status(400).json({ message: "Esta empresa ya está verificada" });
    }

    const nuevoToken = randomUUID();
    await empresa.update({ token_verificacion: nuevoToken });

    const urlVerificacion = `${URL}/api/empresas/verificar/${nuevoToken}`;
    enviarEmailVerificacion(email, empresa.nombre_comercial, urlVerificacion);

    res.status(200).json({ message: "Email de verificación reenviado correctamente" });
  } catch (error) {
    logger.error("reenviarVerificacionEmpresa", error);
    res.status(500).json({ message: "Error al reenviar el email de verificación" });
  }
};

//-------------------------------------------------------------------------
// REGISTRO PUBLICO TRANSACCIONAL
//-------------------------------------------------------------------------
//Crea empresa + admin inicial en UNA SOLA transaccion.
//Si falla cualquier paso, se hace rollback automatico y NO queda una empresa
//huerfana en la BD. Sustituye al patron antiguo de "crea empresa, despues
//createUsuario y si falla intenta deleteEmpresaCorreo a mano".
//
//Campos esperados (todos validados antes por validarRegistroEmpresa):
//  empresa: { nombre_comercial, razon_social, nif, email, telefono, direccion,
//             codigo_postal, ciudad, provincia, logo_url? }
//  admin:   { nombre, email, password }
//
//Devuelve la empresa creada (con el toJSON aplicado, sin token_verificacion).
export const registroTransaccional = async (req, res) => {
  const transaccion = await sequelize.transaction();

  try {
    const { empresa: empresaInput, admin: adminInput } = req.body;

    if (!empresaInput || !adminInput) {
      await transaccion.rollback();
      return res
        .status(400)
        .json({ message: "Faltan los datos de empresa o admin" });
    }

    const nifMayusculas = String(empresaInput.nif || "").toUpperCase();

    //Limpieza previa: si hay empresas no verificadas con el mismo nif/email/telefono,
    //borramos para permitir reintento del registro (sin huerfanos: borramos tambien
    //sus usuarios). Se hace todo dentro de la transaccion.
    const empresasNoVerificadas = await Empresa.findAll({
      where: {
        email_verificado: false,
        [Op.or]: [
          { nif: nifMayusculas },
          { email: empresaInput.email },
          { telefono: empresaInput.telefono },
        ],
      },
      transaction: transaccion,
    });
    for (const emp of empresasNoVerificadas) {
      await Usuario.destroy({
        where: { empresa_id: emp.id },
        transaction: transaccion,
      });
      await emp.destroy({ transaction: transaccion });
    }

    //Unicidad contra empresas ya verificadas (las que sobreviven al limpiado).
    const conflictosEmpresa = await Empresa.findOne({
      where: {
        [Op.or]: [
          { email: empresaInput.email },
          { nif: nifMayusculas },
          { telefono: empresaInput.telefono },
        ],
      },
      transaction: transaccion,
    });
    if (conflictosEmpresa) {
      await transaccion.rollback();
      return res
        .status(400)
        .json({ message: "Ya existe una empresa con ese email, NIF o telefono" });
    }

    //El email del admin no debe coincidir con el de un usuario existente.
    const conflictoUsuario = await Usuario.findOne({
      where: { email: adminInput.email },
      transaction: transaccion,
    });
    if (conflictoUsuario) {
      await transaccion.rollback();
      return res
        .status(400)
        .json({ message: "Ya existe un usuario con ese email" });
    }

    const token = randomUUID();
    const fechaVencimiento = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    //Crea la empresa (suscripcion_activa = false, email_verificado = false, etc.)
    const empresa = await Empresa.create(
      {
        nombre_comercial: empresaInput.nombre_comercial,
        razon_social: empresaInput.razon_social,
        nif: nifMayusculas,
        email: empresaInput.email,
        telefono: empresaInput.telefono,
        direccion: empresaInput.direccion,
        codigo_postal: empresaInput.codigo_postal,
        ciudad: empresaInput.ciudad,
        provincia: empresaInput.provincia,
        logo_url: empresaInput.logo_url || null,
        suscripcion_activa: false,
        activo: true,
        fecha_vencimiento: fechaVencimiento,
        email_verificado: false,
        token_verificacion: token,
      },
      { transaction: transaccion },
    );

    //Crea el admin (forzamos rol='admin', ignorando lo que mande el cliente).
    const hashed = await hashPassword(adminInput.password);
    await Usuario.create(
      {
        empresa_id: empresa.id,
        nombre: adminInput.nombre,
        email: adminInput.email,
        password: hashed,
        rol: "admin",
      },
      { transaction: transaccion },
    );

    await transaccion.commit();

    //Email de verificacion FUERA de la transaccion: si falla el envio,
    //la empresa ya esta creada y el usuario puede pedir reenvio.
    const urlVerificacion = `${URL}/api/empresas/verificar/${token}`;
    enviarEmailVerificacion(
      empresaInput.email,
      empresaInput.nombre_comercial,
      urlVerificacion,
    );

    //toJSON del modelo filtra token_verificacion automaticamente.
    res.status(201).json({
      message: "Empresa y administrador creados correctamente",
      empresa,
    });
  } catch (error) {
    //Si ya hubo rollback explicito, esta segunda llamada es no-op en sequelize.
    try {
      await transaccion.rollback();
    } catch {
      //ignoramos: rollback ya aplicado
    }
    logger.error("registroTransaccional", error);
    res.status(500).json({ message: "Error al registrar la empresa" });
  }
};
