import { Cliente } from "../models/cliente.model.js";
import {
  assertEmpresaIdParam,
  assertOwnsRecurso,
  empresaIdEfectivo,
} from "../utils/tenant.js";

//Las validaciones de formato (tipo_cliente enum, longitudes, regex de telefono/NIF/CIF,
//descuento_fijo 0-100, email) las hace ahora el validator de express-validator
//en la ruta — ver backend/src/validators/clientes.validator.js.
//Aqui solo aplicamos reglas de NEGOCIO: tenant isolation y persistencia.

//OBTENER TODOS LOS CLIENTES DE UNA EMPRESA
export const getClientesByEmpresa = async (req, res) => {
  try {
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const empresa_id = Number(req.params.empresa_id);
    const clientes = await Cliente.findAll({ where: { empresa_id } });

    //lista vacia -> 200 + []; reservamos 404 para id concreto inexistente.
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
    const cliente = await Cliente.findByPk(req.params.id);
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
    //empresa_id se toma SIEMPRE del JWT (ignorando el del body)
    //salvo superadmin, que puede crear clientes en cualquier empresa.
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
    const cliente = await Cliente.findByPk(req.params.id);
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
    const cliente = await Cliente.findByPk(req.params.id);
    if (!assertOwnsRecurso(req, res, cliente)) return;

    const {
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    } = req.body;

    //empresa_id NO se acepta del body: si el cliente pertenece a la empresa X,
    //sigue perteneciendo a la empresa X. Evita reasignacion via PUT.
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
