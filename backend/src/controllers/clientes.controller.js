import { Cliente } from "../models/cliente.model.js";
import { Pedido } from "../models/pedido.model.js";
import { Presupuesto } from "../models/presupuesto.model.js";
import {
  assertEmpresaIdParam,
  assertOwnsRecurso,
  empresaIdEfectivo,
} from "../utils/tenant.js";

//las validaciones de formato (tipo_cliente, longitudes, regex de telefono y NIF/CIF, descuento_fijo, email)
//las hace el validator de express-validator en la ruta antes de llegar al controller
//aqui solo me ocupo de las reglas de negocio: aislamiento de empresa y persistencia

//funcion para obtener todos los clientes de una empresa
export const getClientesByEmpresa = async (req, res) => {
  try {
    //compruebo que el empresa_id de la URL coincide con el del JWT (salvo superadmin)
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const empresa_id = Number(req.params.empresa_id);
    const clientes = await Cliente.findAll({ where: { empresa_id } });

    //si no hay clientes devuelvo array vacio con 200 para que el frontend no falle
    //reservo el 404 para los casos en los que se pida un id concreto que no existe
    res.status(200).json(clientes);
  } catch (error) {
    console.error("[getClientesByEmpresa] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los clientes de esta empresa" });
  }
};

//funcion para buscar un cliente por su id
export const getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    //compruebo que el cliente pertenezca a mi empresa; si no, devuelve 404 para no filtrar la existencia del id ajeno
    if (!assertOwnsRecurso(req, res, cliente)) return;
    res.status(200).json(cliente);
  } catch (error) {
    console.error("[getClienteById] error:", error);
    res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

//funcion para añadir un cliente nuevo
export const addCliente = async (req, res) => {
  try {
    //el empresa_id se coge SIEMPRE del JWT ignorando el del body
    //solo el superadmin puede crear clientes en empresas distintas a la suya
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

//funcion para borrar un cliente
export const deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    //solo se puede borrar un cliente de la propia empresa
    if (!assertOwnsRecurso(req, res, cliente)) return;

    const [pedidos, presupuestos] = await Promise.all([
      Pedido.count({ where: { cliente_id: cliente.id } }),
      Presupuesto.count({ where: { cliente_id: cliente.id } }),
    ]);

    if (pedidos > 0 || presupuestos > 0) {
      return res.status(409).json({
        message:
          "No se puede eliminar el cliente porque tiene pedidos o presupuestos asociados.",
      });
    }

    await cliente.destroy();
    res.status(200).json({ message: "Cliente borrado correctamente" });
  } catch (error) {
    console.error("[deleteCliente] error:", error);
    res.status(500).json({ message: "Error al borrar el cliente" });
  }
};

//funcion para actualizar un cliente existente
export const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    //el cliente debe pertenecer a mi empresa
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

    //empresa_id NO se acepta del body, asi un PUT manipulado no puede mover un cliente a otra empresa
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
