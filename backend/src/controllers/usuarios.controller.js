import { Usuario } from "../models/usuario.model.js";
import { Pedido } from "../models/pedido.model.js";
import { Presupuesto } from "../models/presupuesto.model.js";
import { PrecioEmpresa } from "../models/precioEmpresa.model.js";
import { sequelize } from "../data/db.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Empresa } from "../models/empresa.model.js";
import { randomBytes } from "crypto";
import { enviarEmailRecuperacion } from "../mailer.js";
import { FRONTEND_URL } from "../config.js";
import { emitirTokens } from "./auth.controller.js";
import {
  hashPassword,
  hashToken,
  generarTokenReset,
} from "../utils/seguridad.js";
import { logger } from "../utils/logger.js";

export const getUsuarios = async (req, res) => {
  try {
    //busco todos los usuarios
    const usuarios = await Usuario.findAll();

    //valido que haya usuarios, si no hay, lo digo
    if (usuarios.length === 0) {
      return res.status(404).json({ message: "No hay usuarios" });
    }

    //si hay usuarios, los devuelvo
    res.status(200).json(usuarios);
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("getUsuarios", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al obtener los usuarios" });
  }
};

export const getUsuario = async (req, res) => {
  try {
    //recojo el id que se pasa por la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //hago la busqueda del usuario por el id
    const usuario = await Usuario.findByPk(id);

    //valido que el usuario se haya encontrado, por lo que existira
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no existe" });
    }
    //si se encuentra el usuario, lo devuelvo
    res.status(200).json(usuario);
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("getUsuario", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al obtener el usuario" });
  }
};

export const getUsuarioPorEmpresa = async (req, res) => {
  try {
    //recojo el id de la empresa que se pasa por la URL (SE QUE SE LLAMA ASI PORQUE LO DEFINO EN LA RUTA DE BACKEND)
    const { empresa_id } = req.params;

    //valido que el id de la empresa sea requerido
    if (!empresa_id) {
      return res
        .status(400)
        .json({ message: "El ID de la empresa es requerido" });
    }

    //busco el usuario por el id de la empresa
    const usuario = await Usuario.findAll({
      where: { empresa_id: empresa_id },
    });

    //valido que haya usuarios, si no hay, lo digo
    if (usuario.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay usuarios en esta empresa" });
    }

    //si hay usuarios, los devuelvo
    res.status(200).json(usuario);
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("getUsuarioPorEmpresa", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res
      .status(500)
      .json({ message: "Error al obtener el usuario por empresa" });
  }
};

export const createUsuario = async (req, res) => {
  try {
    //Validaciones de formato (todos requeridos, email valido, password >= 8, rol del enum)
    //las hace validarCrearUsuario antes del controller. Aqui: solo reglas de negocio.
    const { empresa_id, nombre, email, password, rol } = req.body;

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //valido que el email no este registrado
    const existeUsuario = await Usuario.findOne({ where: { email: email } });
    if (existeUsuario) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //valido que el email no este registrado en la empresa
    const existeEmpresa = await Empresa.findOne({
      where: { email: email },
    });

    //valido que la empresa exista
    if (existeEmpresa) {
      return res
        .status(400)
        .json({ message: "El email ya esta registrado en la empresa" });
    }

    //hasheo la contraseña
    const hashedPassword = await hashPassword(password);

    //creo el usuario
    const usuario = await Usuario.create({
      empresa_id: empresa_id,
      nombre: nombre,
      email: email,
      password: hashedPassword,
      rol: rol,
    });

    //devuelvo un mensaje de exito y el usuario creado
    res
      .status(200)
      .json({ message: "Usuario creado correctamente", usuario: usuario });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("createUsuario", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    //Validaciones de formato las hace validarActualizarUsuario antes del controller.
    //Aqui: solo reglas de negocio (unicidad de email, ultimo admin, password fuerte).
    const { id } = req.params;
    const { empresa_id, nombre, email, password, rol } = req.body;

    //esto me ha ayudado la ia, ya que si no siempre me fallaba porque el email es el mismo y no se actualizaba
    // comprobar que el email no está usado por OTRO usuario distinto
    const existeUsuario = await Usuario.findOne({
      where: {
        email,
        id: { [Op.ne]: id }, //excluye al propio usuario
      },
    });

    //valido que el email no este registrado en la empresa
    const existeEmpresa = await Empresa.findOne({
      where: { email: email },
    });

    //valido que el email no este registrado en la empresa
    if (existeEmpresa) {
      return res
        .status(400)
        .json({ message: "El email ya esta registrado en la empresa" });
    }

    //valido que el email no este registrado
    if (existeUsuario) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //busco el usuario por el id para ver si existe
    const usuarioExiste = await Usuario.findByPk(id);

    //valido que el usuario exista
    if (!usuarioExiste) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    //no permitir que la empresa se quede sin ningún usuario con rol admin
    const empresaOrigenId = usuarioExiste.empresa_id;
    const empresaDestinoId = empresa_id;
    const cambiaEmpresa =
      String(empresaOrigenId) !== String(empresaDestinoId);

    if (cambiaEmpresa && usuarioExiste.rol === "admin") {
      const otrosAdminsEmpresaOrigen = await Usuario.count({
        where: {
          empresa_id: empresaOrigenId,
          rol: "admin",
          id: { [Op.ne]: id },
        },
      });

      if (otrosAdminsEmpresaOrigen === 0) {
        return res
          .status(400)
          .json({
            message: "No se puede dejar la empresa sin administradores",
          });
      }
    }

    if (rol !== "admin") {
      const otrosAdminsEmpresaDestino = await Usuario.count({
        where: {
          empresa_id: empresaDestinoId,
          rol: "admin",
          id: { [Op.ne]: id },
        },
      });

      if (otrosAdminsEmpresaDestino === 0) {
        return res
          .status(400)
          .json({
            message: "No se puede dejar la empresa sin administradores",
          });
      }
    }

    //si viene contraseña en el body la preparo; si viene vacía o no viene, no se toca password en BD
    const passwordNueva = password ? password.trim() : "";

    if (passwordNueva.length > 0) {
      const regexPasswordFuerte =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
      if (!regexPasswordFuerte.test(passwordNueva)) {
        return res.status(400).json({
          message:
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, números y un carácter especial",
        });
      }

      const hashedPassword = await hashPassword(passwordNueva);

      //actualizo el usuario incluyendo la nueva contraseña
      const usuario = await usuarioExiste.update({
        empresa_id: empresa_id,
        nombre: nombre,
        email: email,
        rol: rol,
        password: hashedPassword,
      });

      return res.status(200).json({
        message: "Usuario actualizado correctamente",
        usuario: usuario,
      });
    }

    //actualizo el usuario sin tocar la contraseña (se deja la que ya estaba en BD)
    const usuario = await usuarioExiste.update({
      empresa_id: empresa_id,
      nombre: nombre,
      email: email,
      rol: rol,
    });

    //devuelvo un mensaje de exito y el usuario actualizado
    res
      .status(200)
      .json({ message: "Usuario actualizado correctamente", usuario: usuario });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("updateUsuario", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al actualizar el usuario" });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    //recojo el id de la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //busco el usuario por el id
    const usuario = await Usuario.findByPk(id);

    //valido que el usuario exista
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.rol === "admin") {
      const otrosAdmins = await Usuario.count({
        where: {
          empresa_id: usuario.empresa_id,
          rol: "admin",
          id: { [Op.ne]: usuario.id },
        },
      });

      if (otrosAdmins === 0) {
        return res
          .status(400)
          .json({
            message: "No se puede dejar la empresa sin administradores",
          });
      }
    }

    const [pedidos, presupuestos, precios] = await Promise.all([
      Pedido.count({ where: { operario_asignado_id: usuario.id } }),
      Presupuesto.count({ where: { usuario_id: usuario.id } }),
      PrecioEmpresa.count({ where: { usuario_id: usuario.id } }),
    ]);

    if (pedidos > 0 || presupuestos > 0 || precios > 0) {
      return res.status(409).json({
        message:
          "No se puede eliminar el usuario porque tiene pedidos, presupuestos o precios asociados.",
      });
    }

    //elimino el usuario
    await usuario.destroy();

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("deleteUsuario", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al eliminar el usuario" });
  }
};

export const deleteUsuarioCorreo = async (req, res) => {
  try {
    const { correo } = req.params;

    //valido que el correo sea requerido
    if (!correo) {
      return res.status(400).json({ message: "El correo es requerido" });
    }

    //busco el usuario por el correo
    const usuario = await Usuario.findOne({ where: { email: correo } });

    //valido que el usuario exista
    if (!usuario) {
      return res.status(404).json({ message: "El correo no esta registrado" });
    }

    if (usuario.rol === "admin") {
      const otrosAdmins = await Usuario.count({
        where: {
          empresa_id: usuario.empresa_id,
          rol: "admin",
          id: { [Op.ne]: usuario.id },
        },
      });

      if (otrosAdmins === 0) {
        return res
          .status(400)
          .json({
            message: "No se puede dejar la empresa sin administradores",
          });
      }
    }

    //elimino el usuario
    await usuario.destroy();

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("deleteUsuarioCorreo", error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al eliminar el usuario por correo" });
  }
};

export const solicitarRecuperacion = async (req, res) => {
  try {
    //Validacion (email requerido + formato) la hace validarRecuperarPassword.
    const { email } = req.body;

    //busco el usuario por su email
    const usuario = await Usuario.findOne({ where: { email } });

    //si no existe el usuario, devuelvo el mismo mensaje que si existiera para no dar pistas de si el email esta registrado o no
    if (!usuario) {
      return res.status(200).json({ message: "Si el email está registrado, recibirás un correo en breve." });
    }

    //Generamos un par (plano, hash). El plano viaja por email en la URL,
    //el hash es lo unico que persiste en BD -> si la BD se filtra, no se puede
    //usar el hash para reset (sha256 no es reversible).
    const { plano: tokenPlano, hash: tokenHash } = generarTokenReset();

    //token vigente durante 1 hora desde ahora
    const expira = new Date(Date.now() + 60 * 60 * 1000);

    //guardo en BD el HASH del token, no el token mismo
    await usuario.update({ reset_token: tokenHash, reset_token_expira: expira });

    //la URL al usuario lleva el token EN CLARO (es el unico sitio donde existe)
    const urlReset = `${FRONTEND_URL}/password-nueva?token=${tokenPlano}`;

    //envio el correo de recuperacion con el enlace al usuario
    enviarEmailRecuperacion(email, usuario.nombre, urlReset);

    //devuelvo el mismo mensaje independientemente de si el usuario existe o no
    res.status(200).json({ message: "Si el email está registrado, recibirás un correo en breve." });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("solicitarRecuperacion", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al procesar la solicitud de recuperación de contraseña" });
  }
};

export const restablecerPassword = async (req, res) => {
  try {
    //Validacion (token presente + password >= 8) la hace validarRestablecerPassword.
    const { token, password } = req.body;

    //El cliente nos manda el token en CLARO; en BD esta el sha256.
    //Buscamos por el hash.
    const tokenHash = hashToken(token);
    const usuario = await Usuario.findOne({ where: { reset_token: tokenHash } });

    //valido que el token sea valido, si no existe es que ya fue usado o nunca existio
    if (!usuario) {
      return res.status(400).json({ message: "El enlace no es válido o ya ha sido utilizado" });
    }

    //valido que el token no haya expirado comparando la fecha actual con la de expiracion
    if (new Date() > usuario.reset_token_expira) {
      //limpio el token caducado de la base de datos para que no ocupe espacio
      await usuario.update({ reset_token: null, reset_token_expira: null });
      return res.status(400).json({ message: "El enlace ha caducado. Solicita uno nuevo." });
    }

    //hasheo la nueva contraseña antes de guardarla en la base de datos
    const hashedPassword = await hashPassword(password);

    //actualizo la contraseña del usuario y elimino el token para que no se pueda reutilizar
    await usuario.update({ password: hashedPassword, reset_token: null, reset_token_expira: null });

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("restablecerPassword", error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al restablecer la contraseña" });
  }
};

export const getUsuarioCorreoContraseña = async (req, res) => {
  try {
    //Validacion (correo requerido + isEmail + password >= 8) la hace validarLogin.
    const { correo, contraseña } = req.body;

    //busco el usuario solo por correo (la contraseña en BD esta hasheada)
    const usuario = await Usuario.findOne({ where: { email: correo } });

    if (!usuario) {
      return res
        .status(404)
        .json({ message: "El correo o la contraseña son incorrectos" });
    }

    //comparo la contraseña en claro con el hash guardado
    const contraseñaCorrecta = await bcrypt.compare(
      contraseña,
      usuario.password,
    );
    if (!contraseñaCorrecta) {
      return res
        .status(404)
        .json({ message: "El correo o la contraseña son incorrectos" });
    }

    //compruebo si la empresa de este usuario ha verificado su email
    const empresa = await Empresa.findByPk(usuario.empresa_id);
    if (!empresa || !empresa.email_verificado) {
      return res
        .status(403)
        .json({ message: "La empresa no ha verificado su correo electrónico. Revisa tu bandeja de entrada." });
    }

    //emito access + refresh token. El access caduca a los 15 min; el refresh
    //a los 7 dias y se usa contra POST /auth/refresh para extender la sesion.
    const tokens = emitirTokens(usuario);
    res.status(200).json({ ...tokens, usuario });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    logger.error("getUsuarioCorreoContraseña", error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener el usuario por correo y contraseña" });
  }
};

//Endpoint PUBLICO de registro: crea el primer admin de una empresa recien creada.
//Reemplaza al POST /usuarios para el flujo de registro porque POST /usuarios pasa a
//requerir autenticacion (solo admin). Para evitar que cualquiera lo use de forma
//abusiva imponemos tres invariantes:
//   1. La empresa debe existir.
//   2. La empresa NO debe tener su email verificado (sigue en flujo de alta).
//   3. La empresa NO debe tener todavia ningun usuario asociado.
//Ademas forzamos rol = 'admin' (ignoramos lo que mande el cliente).
export const crearAdminInicial = async (req, res) => {
  try {
    //Validacion (campos requeridos, email valido, password >= 8) la hace
    //validarRegistroInicial antes del controller.
    const { empresa_id, nombre, email, password } = req.body;

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //solo permitimos este endpoint cuando la empresa NO esta verificada todavia
    //(esta en el flujo de registro). Si ya esta verificada, hay que usar el flujo
    //normal autenticado de creacion de usuarios.
    if (empresa.email_verificado) {
      return res
        .status(403)
        .json({ message: "Esta empresa ya esta verificada. Crea usuarios desde el panel de administracion." });
    }

    //solo se permite si la empresa NO tiene aun ningun usuario (registro inicial)
    const usuariosExistentes = await Usuario.count({ where: { empresa_id } });
    if (usuariosExistentes > 0) {
      return res
        .status(409)
        .json({ message: "Esta empresa ya tiene un administrador inicial" });
    }

    //comprobacion de email unico (cubre tanto usuarios como empresas)
    const existeUsuario = await Usuario.findOne({ where: { email } });
    if (existeUsuario) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }
    const existeEmpresa = await Empresa.findOne({ where: { email } });
    if (existeEmpresa && existeEmpresa.id !== Number(empresa_id)) {
      return res.status(400).json({ message: "El email ya esta registrado" });
    }

    //hasheo y creo. El rol se fuerza a 'admin' aunque el cliente mande otra cosa.
    const hashedPassword = await hashPassword(password);
    const usuario = await Usuario.create({
      empresa_id,
      nombre,
      email,
      password: hashedPassword,
      rol: "admin",
    });

    //devuelvo el usuario (el toJSON del modelo ya filtra password / reset_token)
    res
      .status(201)
      .json({ message: "Admin inicial creado correctamente", usuario });
  } catch (error) {
    console.error("[crearAdminInicial] error:", error);
    res.status(500).json({ message: "Error al crear el admin inicial" });
  }
};
