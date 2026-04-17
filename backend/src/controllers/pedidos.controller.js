import { Pedido } from "../models/pedidos.model.js";
import { sequelize } from "../data/db.js";

const PEDIDOS_WITH_CLIENTE_SELECT = `
    SELECT 
        p.*,
        c.nombre_empresa_o_particular AS cliente_nombre,
        c.direccion AS cliente_direccion
    FROM pedidos p
    INNER JOIN clientes c ON c.id = p.cliente_id
`;

//OBTENER TODOS LOS PEDIDOS
export const getPedidos = async (req, res) => {
  try {
    // busco todos los pedidos junto con nombre/dirección del cliente
    const [pedidos] = await sequelize.query(`
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            ORDER BY p.id DESC
        `);

    //valido que haya pedidos, si no hay digo que no hay
    if (pedidos.length === 0) {
      return res.status(404).json({ message: "No hay pedidos" });
    }

    //devuelvo los pedidos
    res.status(200).json(pedidos);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
};

//BUSCAR PEDIDO POR OPERARIO
export const getPedidosByOperario = async (req, res) => {
  try {
    //obtengo el id del operario de URL
    const { id } = req.params;

    // busco los pedidos junto con nombre/dirección del cliente
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.operario_asignado_id = ? AND p.estado_fabricacion = 'en_fabricacion'
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    // Sin pedidos en fabricación: lista vacía (200), no 404 — si no, el cliente HTTP falla y la UI no actualiza
    if (pedidos.length === 0) {
      return res.status(200).json([]);
    }

    //ordenar por fecha de inicio estimada
    pedidos.sort(
      (a, b) =>
        new Date(a.fecha_inicio_estimada) - new Date(b.fecha_inicio_estimada),
    );

    //devuelvo los pedidos
    res.status(200).json(pedidos);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({
        message: "Error al obtener los pedidos asignados a este operario",
      });
  }
};

//BUSCAR PEDIDOS POR EMPRESA
export const getPedidosByEmpresa = async (req, res) => {
  try {
    //obtengo el id de la empresa de URL
    const { id } = req.params;

    // busco los pedidos junto con nombre/dirección del cliente
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.empresa_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    //valido que haya pedidos, si no hay digo que no hay
    if (pedidos.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay pedidos de esta empresa" });
    }

    //devuelvo los pedidos
    res.status(200).json(pedidos);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de esta empresa" });
  }
};

//AÑADIR PEDIDO

//BORRAR PEDIDO
export const deletePedido = async (req, res) => {
  try {
    //obtengo el id del pedido
    const { id } = req.params;

    //busco el pedido por su id
    const pedido = await Pedido.findByPk(id);

    //valido que el pedido exista
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    //borro el pedido
    await pedido.destroy();

    //confirmo que el pedido se ha borrado
    res.status(200).json({ message: "Pedido borrado correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al borrar el pedido" });
  }
};

//MARCAR COMO FABRICADO
export const marcarComoFabricado = async (req, res) => {
  try {
    //obtengo el id del pedido
    const { id } = req.params;

    //busco el pedido por su id
    const pedido = await Pedido.findByPk(id);

    //valido que el pedido exista
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    //marco como fabricado
    pedido.estado_fabricacion = "fabricado";
    //lo guardo
    await pedido.save();

    //confirmo que el pedido se ha marcado como fabricado
    res
      .status(200)
      .json({ message: "Pedido marcado como fabricado correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al marcar como fabricado el pedido" });
  }
};

//OBTENER TODOS LOS PEDIDOS DE UN OPERARIO
export const getPedidosHistorialByOperario = async (req, res) => {
  try {
    //obtengo el id del operario de URL
    const { id } = req.params;

    //busco los pedidos junto con nombre/dirección del cliente
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.operario_asignado_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    //valido que haya pedidos, si no hay digo que no hay
    if (pedidos.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay pedidos de este operario" });
    }

    //devuelvo los pedidos
    res.status(200).json(pedidos);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de este operario" });
  }
};
