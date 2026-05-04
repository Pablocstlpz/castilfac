import { Usuario } from "../models/usuario.model.js";
import { sequelize } from "../data/db.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { Empresa } from "../models/empresa.model.js";

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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res
      .status(500)
      .json({ message: "Error al obtener el usuario por empresa" });
  }
};

export const createUsuario = async (req, res) => {
  try {
    //recojo los datos que se pasan por el body
    const { empresa_id, nombre, email, password, rol } = req.body;

    //valido que todos los campos sean requeridos
    if (!empresa_id || !nombre || !email || !password || !rol) {
      return res
        .status(400)
        .json({ message: "Todos los campos son requeridos" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //valido que el email sea un email valido
    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "El email debe ser un email valido" });
    }

    //valido que la contraseña tenga al menos 8 caracteres
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 8 caracteres" });
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
    const hashedPassword = await bcrypt.hash(password, 10);

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
    console.log(error);
    //devuelvo un mensaje de error al usuario si hay algun error
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    //recojo el id que se pasa por la URL
    const { id } = req.params;

    //valido que el id sea requerido
    if (!id) {
      return res.status(400).json({ message: "El ID es requerido" });
    }

    //recojo los datos que se pasan por el body
    const { empresa_id, nombre, email, password, rol } = req.body;

    // empresa_id, nombre, email y rol obligatorios; contraseña opcional (vacía = no cambiar)
    if (!empresa_id || !nombre || !email || !rol) {
      return res
        .status(400)
        .json({ message: "empresa_id, nombre, email y rol son requeridos" });
    }

    //valido que el email sea un email valido
    if (!email.includes("@")) {
      return res
        .status(400)
        .json({ message: "El email debe ser un email valido" });
    }

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

      const hashedPassword = await bcrypt.hash(passwordNueva, 10);

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
    console.log(error);
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

    //elimino el usuario
    await usuario.destroy();

    //devuelvo un mensaje de exito
    res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    console.log(error);
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
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al eliminar el usuario por correo" });
  }
};

export const getUsuarioCorreoContraseña = async (req, res) => {
  try {
    //recojo el correo y la contraseña que se pasan por el body
    const { correo, contraseña } = req.body;

    //valido que el correo y la contraseña sean requeridos
    if (!correo || !contraseña) {
      return res
        .status(400)
        .json({ message: "El correo y la contraseña son requeridos" });
    }

    //valido que el correo sea un email valido
    if (!correo.includes("@")) {
      return res
        .status(400)
        .json({ message: "El correo debe ser un email valido" });
    }

    //valido que la contraseña tenga al menos 8 caracteres
    if (contraseña.length < 8) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 8 caracteres" });
    }

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

    //devuelvo el usuario
    res.status(200).json(usuario);
  } catch (error) {
    //muestro el error por consola, ya que el error me lo dira en la terminal en la que tengo desplegado el backend
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener el usuario por correo y contraseña" });
  }
};
