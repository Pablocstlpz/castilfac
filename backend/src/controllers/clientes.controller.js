import { Cliente } from "../models/cliente.model.js";
import {
  assertEmpresaIdParam,
  assertOwnsRecurso,
  empresaIdEfectivo,
} from "../utils/tenant.js";

//Limites y enums centralizados para usarlos tanto en create como en update.
const TIPOS_CLIENTE = ["particular", "empresa", "vip", "mayorista"];
const REGEX_TELEFONO = /^\+?[1-9]\d{6,14}$/;
const REGEX_NIF_CIF = /^[A-Za-z0-9]{8,12}$/; //permisivo: cubre DNI/NIE/CIF
const MAX_NOMBRE = 255;
const MAX_EMAIL = 255;
const MAX_DIRECCION = 500;

//Valida los campos del body para crear/actualizar un cliente.
//Devuelve null si todo OK o un string con el primer error encontrado.
const validarPayloadCliente = (payload, { paraCrear }) => {
  const {
    nombre_empresa_o_particular,
    nif_cif,
    telefono,
    email,
    tipo_cliente,
    descuento_fijo,
    direccion,
  } = payload;

  if (paraCrear && !nombre_empresa_o_particular) {
    return "El nombre del cliente es obligatorio";
  }
  if (
    nombre_empresa_o_particular !== undefined &&
    (typeof nombre_empresa_o_particular !== "string" ||
      nombre_empresa_o_particular.trim().length === 0 ||
      nombre_empresa_o_particular.length > MAX_NOMBRE)
  ) {
    return `El nombre debe tener entre 1 y ${MAX_NOMBRE} caracteres`;
  }

  if (tipo_cliente !== undefined && !TIPOS_CLIENTE.includes(tipo_cliente)) {
    return `tipo_cliente debe ser uno de: ${TIPOS_CLIENTE.join(", ")}`;
  }

  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string" || email.length > MAX_EMAIL || !email.includes("@")) {
      return "El email no es valido";
    }
  }

  if (telefono !== undefined && telefono !== null && telefono !== "") {
    if (typeof telefono !== "string" || !REGEX_TELEFONO.test(telefono)) {
      return "El telefono no es valido";
    }
  }

  if (nif_cif !== undefined && nif_cif !== null && nif_cif !== "") {
    if (typeof nif_cif !== "string" || !REGEX_NIF_CIF.test(nif_cif)) {
      return "El NIF/CIF no es valido";
    }
  }

  if (descuento_fijo !== undefined && descuento_fijo !== null) {
    const numero = Number(descuento_fijo);
    if (Number.isNaN(numero) || numero < 0 || numero > 100) {
      return "El descuento_fijo debe estar entre 0 y 100";
    }
  }

  if (direccion !== undefined && direccion !== null && direccion !== "") {
    if (typeof direccion !== "string" || direccion.length > MAX_DIRECCION) {
      return `La direccion no puede exceder ${MAX_DIRECCION} caracteres`;
    }
  }

  return null;
};

//OBTENER TODOS LOS CLIENTES DE UNA EMPRESA
export const getClientesByEmpresa = async (req, res) => {
  try {
    //Tenant: el empresa_id del path debe coincidir con el del JWT (salvo superadmin).
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const empresaIdNumero = Number(req.params.empresa_id);
    if (Number.isNaN(empresaIdNumero)) {
      return res.status(400).json({ message: "El ID de empresa no es valido" });
    }

    const clientes = await Cliente.findAll({
      where: { empresa_id: empresaIdNumero },
    });

    //lista vacia -> 200 + []; reservamos 404 para id concreto inexistente
    res.status(200).json(clientes);
  } catch (error) {
    console.error("[getClientesByEmpresa] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los clientes de esta empresa" });
  }
};

//BUSCAR CLIENTE POR SU ID
export const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    //Tenant: comprueba que el cliente pertenece a la empresa del JWT.
    //Si no, responde 404 para no filtrar la existencia del id.
    if (!assertOwnsRecurso(req, res, cliente)) return;

    res.status(200).json(cliente);
  } catch (error) {
    console.error("[getClienteById] error:", error);
    res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

//AÑADIR CLIENTE
export const addCliente = async (req, res) => {
  try {
    //Validacion fuerte del payload (resuelve "FALTAN VALIDACIONES")
    const error = validarPayloadCliente(req.body, { paraCrear: true });
    if (error) return res.status(400).json({ message: error });

    //empresa_id se toma SIEMPRE del JWT, ignoramos el del body
    //(salvo superadmin, que puede crear clientes en cualquier empresa).
    const empresa_id = empresaIdEfectivo(req);
    if (!empresa_id) {
      return res.status(400).json({ message: "Empresa no identificada" });
    }

    const {
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    } = req.body;

    const cliente = await Cliente.create({
      empresa_id,
      nombre_empresa_o_particular,
      nif_cif: nif_cif || null,
      telefono: telefono || null,
      email: email || null,
      tipo_cliente: tipo_cliente || "particular",
      descuento_fijo: descuento_fijo ?? 0,
      direccion: direccion || null,
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("[addCliente] error:", error);
    res.status(500).json({ message: "Error al añadir el cliente" });
  }
};

//BORRAR CLIENTE
export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    //Tenant: solo se puede borrar un cliente de la propia empresa.
    if (!assertOwnsRecurso(req, res, cliente)) return;

    await cliente.destroy();

    res.status(200).json({ message: "Cliente borrado correctamente" });
  } catch (error) {
    console.error("[deleteCliente] error:", error);
    res.status(500).json({ message: "Error al borrar el cliente" });
  }
};

//ACTUALIZAR CLIENTE
export const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    //Tenant: el cliente debe pertenecer a la empresa del usuario.
    if (!assertOwnsRecurso(req, res, cliente)) return;

    //Validacion del payload (sin obligar a nombre porque permitimos PATCH parciales).
    const errorValidacion = validarPayloadCliente(req.body, { paraCrear: false });
    if (errorValidacion) return res.status(400).json({ message: errorValidacion });

    const {
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    } = req.body;

    //Sustituimos empresa_id por el del JWT para evitar que un body manipulado
    //mueva un cliente a otra empresa.
    const clienteActualizado = await cliente.update({
      empresa_id: cliente.empresa_id,
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    });

    res.status(200).json(clienteActualizado);
  } catch (error) {
    console.error("[updateCliente] error:", error);
    res.status(500).json({ message: "Error al actualizar el cliente" });
  }
};
