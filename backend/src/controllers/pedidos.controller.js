import { Pedido } from "../models/pedido.model.js";
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

//OBTENER PEDIDO POR SU ID
export const getPedidoById = async (req, res) => {
  try {
    //obtengo el id del pedido de URL
    const { id } = req.params;

    // busco el pedido junto con el nombre y dirección del cliente via JOIN
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.id = ?
            `,
      { replacements: [id] },
    );

    //valido que exista
    if (pedidos.length === 0) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    //devuelvo el pedido (el primero del array)
    res.status(200).json(pedidos[0]);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al obtener el pedido" });
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
    res.status(500).json({
      message: "Error al obtener los pedidos asignados a este operario",
    });
  }
};

//BUSCAR PEDIDOS POR CLIENTE
export const getPedidosByCliente = async (req, res) => {
  try {
    //obtengo el id del cliente de URL
    const { id } = req.params;

    // busco los pedidos junto con nombre/dirección del cliente
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.cliente_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    //si no hay pedidos devuelvo array vacio para que el frontend no falle
    if (pedidos.length === 0) {
      return res.status(200).json([]);
    }

    //devuelvo los pedidos
    res.status(200).json(pedidos);
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de este cliente" });
  }
};

//OBTENER DATOS FINANCIEROS DE UNA EMPRESA (con filtro temporal opcional)
export const getFinanzasByEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { rango } = req.query;

    const filtroFecha =
      rango === 'mes'
        ? "AND DATE(p.fecha_creacion) >= DATE_FORMAT(NOW(), '%Y-%m-01')"
        : rango === 'anio'
          ? "AND DATE(p.fecha_creacion) >= DATE_FORMAT(NOW(), '%Y-01-01')"
          : '';

    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.empresa_id = ? AND p.estado_fabricacion != 'cancelado'
            ${filtroFecha}
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    res.status(200).json(pedidos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al obtener las finanzas de esta empresa' });
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

//COMPROBAR SI EXISTE PEDIDO PARA UN PRESUPUESTO
export const existePedidoDePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findOne({ where: { presupuesto_id: id } });

    res.status(200).json({ existe: !!pedido });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al comprobar el pedido' });
  }
};

//AÑADIR PEDIDO
export const createPedido = async (req, res) => {
  try {
    const {
      empresa_id,
      presupuesto_id,
      cliente_id,
      operario_asignado_id,
      importe_acordado,
      fecha_inicio_estimada,
      fecha_entrega_estimada,
    } = req.body;

    if (!empresa_id || !presupuesto_id || !cliente_id || !importe_acordado) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const nuevoPedido = await Pedido.create({
      empresa_id,
      numero_pedido: "PED-" + Date.now(),
      presupuesto_id,
      cliente_id,
      operario_asignado_id: operario_asignado_id || null,
      importe_acordado,
      fecha_pedido: new Date(),
      fecha_inicio_estimada: fecha_inicio_estimada || null,
      fecha_entrega_estimada: fecha_entrega_estimada || null,
      estado_fabricacion: "pendiente",
    });

    res.status(201).json(nuevoPedido);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear el pedido" });
  }
};

//ACTUALIZAR PEDIDO
export const updatePedido = async (req, res) => {
  try {
    //obtengo el id del pedido de URL
    const { id } = req.params;
    //obtengo los datos del pedido del body
    const {
      cliente_id,
      estado_fabricacion,
      fecha_inicio_estimada,
      fecha_entrega_estimada,
      fecha_entrega_real,
      fecha_instalacion,
      importe_acordado,
      importe_pagado,
      operario_asignado_id,
      notas_operario,
    } = req.body;

    //busco el pedido por su id
    const pedido = await Pedido.findByPk(id);

    //valido que el pedido exista
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const camposActualizar = {
      cliente_id,
      estado_fabricacion,
      fecha_inicio_estimada,
      fecha_entrega_estimada,
      fecha_entrega_real,
      fecha_instalacion,
      importe_acordado,
      importe_pagado,
      operario_asignado_id,
      notas_operario,
      fecha_actualizacion: new Date(),
    };

    //elimino campos no enviados para permitir actualizaciones parciales
    Object.keys(camposActualizar).forEach((campo) => {
      if (camposActualizar[campo] === undefined) {
        delete camposActualizar[campo];
      }
    });

    if (Object.keys(camposActualizar).length === 0) {
      return res
        .status(400)
        .json({ message: "No se han enviado campos para actualizar" });
    }

    //actualizo los datos del pedido
    await pedido.update(camposActualizar);

    //confirmo que el pedido se ha actualizado
    res.status(200).json({ message: "Pedido actualizado correctamente" });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al actualizar el pedido" });
  }
};

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
