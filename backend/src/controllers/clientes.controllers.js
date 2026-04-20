import { Cliente } from "../models/clientes.model.js";
import { sequelize } from "../data/db.js";

//FALTAN VALIDACIONES

//OBTENER TODOS LOS CLIENTES DE UNA EMPRESA
export const getClientesByEmpresa = async (req, res) => {
  try {
    //obtengo el id de la empresa de URL
    const { empresa_id } = req.params;

    //valido que el id de empresa sea numerico para evitar errores SQL/Sequelize
    const empresaIdNumero = Number(empresa_id);
    if (!empresa_id || Number.isNaN(empresaIdNumero)) {
      return res.status(400).json({ message: "El ID de empresa no es valido" });
    }

    //busco los clientes de la empresa
    const clientes = await Cliente.findAll({
      where: { empresa_id: empresaIdNumero },
    });

    //valido que haya clientes, si no hay digo que no hay
    if (clientes.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay clientes de esta empresa" });
    }

    //devuelvo los clientes
    res.status(200).json(clientes);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener los clientes de esta empresa" });
  }
};

//BUSCAR CLIENTE POR SU ID
export const getClienteById = async (req, res) => {
  try {
    //obtengo el id del cliente de URL
    const { id } = req.params;

    //busco el cliente por su id
    const cliente = await Cliente.findByPk(id);

    //valido que el cliente exista, si no existe digo que no existe
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    //devuelvo el cliente
    res.status(200).json(cliente);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener el cliente" });
  }
};

//AÑADIR CLIENTE
export const addCliente = async (req, res) => {
  try {
    //obtengo los datos del cliente del body
    const {
      empresa_id,
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    } = req.body;

    //creo el cliente
    const cliente = await Cliente.create({
      empresa_id,
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    });

    //devuelvo el cliente creado
    res.status(201).json(cliente);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al añadir el cliente" });
  }
};

//BORRAR CLIENTE
export const deleteCliente = async (req, res) => {
  try {
    //obtengo el id del cliente de URL
    const { id } = req.params;

    //busco el cliente por su id
    const cliente = await Cliente.findByPk(id);

    //valido que el cliente exista
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    //borro el cliente
    await cliente.destroy();

    //confirmo que el cliente se ha borrado
    res.status(200).json({ message: "Cliente borrado correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al borrar el cliente" });
  }
};

//ACTUALIZAR CLIENTE
export const updateCliente = async (req, res) => {
  try {
    //obtengo el id del cliente de URL
    const { id } = req.params;
    //obtengo los datos del cliente del body
    const {
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    } = req.body;

    //busco el cliente por su id
    const cliente = await Cliente.findByPk(id);

    //valido que el cliente exista
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    //actualizo el cliente
    const clienteActualizado = await cliente.update({
      nombre_empresa_o_particular,
      nif_cif,
      telefono,
      email,
      tipo_cliente,
      descuento_fijo,
      direccion,
    });

    //devuelvo el cliente actualizado
    res.status(200).json(clienteActualizado);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al actualizar el cliente" });
  }
};
