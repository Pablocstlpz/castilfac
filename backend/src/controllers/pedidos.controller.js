import { Pedido } from "../models/pedido.model.js";
import { Usuario } from "../models/usuario.model.js";
import { Cliente } from "../models/cliente.model.js";
import { sequelize } from "../data/db.js";
import {
  assertEmpresaIdParam,
  assertOwnsRecurso,
  empresaIdEfectivo,
  esSuperadmin,
} from "../utils/tenant.js";

//SELECT base para traer pedidos con el nombre y direccion del cliente en una sola query
//asi el frontend no tiene que hacer una llamada extra por cada pedido para conseguir el nombre del cliente
const PEDIDOS_WITH_CLIENTE_SELECT = `
    SELECT
        p.*,
        c.nombre_empresa_o_particular AS cliente_nombre,
        c.direccion AS cliente_direccion
    FROM pedidos p
    INNER JOIN clientes c ON c.id = p.cliente_id
`;

//helper local: compruebo que el usuario con id == :id de la URL es de la misma empresa que el del JWT
//lo uso en getPedidosByOperario y getPedidosHistorialByOperario para que un admin no pueda pedir pedidos de operarios de otra empresa
const validarOperarioDeMiEmpresa = async (req, res) => {
  if (esSuperadmin(req)) return true;
  const operario = await Usuario.findByPk(req.params.id);
  if (!operario || String(operario.empresa_id) !== String(req.user.empresa_id)) {
    res.status(404).json({ message: "Operario no encontrado" });
    return false;
  }
  return true;
};

//igual que el anterior pero para cliente
const validarClienteDeMiEmpresa = async (req, res) => {
  if (esSuperadmin(req)) return true;
  const cliente = await Cliente.findByPk(req.params.id);
  if (!cliente || String(cliente.empresa_id) !== String(req.user.empresa_id)) {
    res.status(404).json({ message: "Cliente no encontrado" });
    return false;
  }
  return true;
};

//funcion para obtener TODOS los pedidos del sistema (solo superadmin via autorizarRol en la ruta)
export const getPedidos = async (req, res) => {
  try {
    const [pedidos] = await sequelize.query(`
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            ORDER BY p.id DESC
        `);
    res.status(200).json(pedidos);
  } catch (error) {
    console.error("[getPedidos] error:", error);
    res.status(500).json({ message: "Error al obtener los pedidos" });
  }
};

//funcion para obtener un pedido por su id
export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    //primero busco con sequelize para poder validar la empresa antes de devolver los datos
    const pedido = await Pedido.findByPk(id);
    if (!assertOwnsRecurso(req, res, pedido)) return;

    //si pasa el chequeo de tenant, recupero el pedido enriquecido con el cliente via SQL crudo
    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.id = ?
            `,
      { replacements: [id] },
    );

    if (pedidos.length === 0) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    res.status(200).json(pedidos[0]);
  } catch (error) {
    console.error("[getPedidoById] error:", error);
    res.status(500).json({ message: "Error al obtener el pedido" });
  }
};

//funcion para buscar pedidos por operario asignado (los operarios solo ven los suyos, los admins ven los de cualquier operario de su empresa)
export const getPedidosByOperario = async (req, res) => {
  try {
    //el operario que pido debe ser de la misma empresa que el del JWT
    if (!(await validarOperarioDeMiEmpresa(req, res))) return;

    //si el que pide es un operario solo puede consultar SUS propios pedidos
    if (
      req.user?.rol === "operario" &&
      String(req.user.id) !== String(req.params.id)
    ) {
      return res
        .status(403)
        .json({ message: "Solo puedes consultar tus propios pedidos" });
    }

    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.operario_asignado_id = ? AND p.estado_fabricacion = 'en_fabricacion'
            ORDER BY p.id DESC
            `,
      { replacements: [req.params.id] },
    );

    //si no hay pedidos devuelvo array vacio con 200 para que el frontend no falle
    if (pedidos.length === 0) return res.status(200).json([]);

    //los ordeno por fecha de inicio estimada para que en la UI salgan los mas proximos primero
    pedidos.sort(
      (a, b) =>
        new Date(a.fecha_inicio_estimada) - new Date(b.fecha_inicio_estimada),
    );

    res.status(200).json(pedidos);
  } catch (error) {
    console.error("[getPedidosByOperario] error:", error);
    res.status(500).json({
      message: "Error al obtener los pedidos asignados a este operario",
    });
  }
};

//funcion para buscar pedidos por cliente
export const getPedidosByCliente = async (req, res) => {
  try {
    //el cliente debe pertenecer a mi empresa
    if (!(await validarClienteDeMiEmpresa(req, res))) return;

    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.cliente_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [req.params.id] },
    );

    if (pedidos.length === 0) return res.status(200).json([]);

    res.status(200).json(pedidos);
  } catch (error) {
    console.error("[getPedidosByCliente] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de este cliente" });
  }
};

//funcion para obtener los datos financieros de una empresa (con filtro temporal opcional por mes o año)
export const getFinanzasByEmpresa = async (req, res) => {
  try {
    //el :id es el empresa_id, compruebo que coincida con el del JWT
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const { id } = req.params;
    const { rango } = req.query;

    const filtroFecha =
      rango === "mes"
        ? "AND DATE(p.fecha_creacion) >= DATE_FORMAT(NOW(), '%Y-%m-01')"
        : rango === "anio"
          ? "AND DATE(p.fecha_creacion) >= DATE_FORMAT(NOW(), '%Y-01-01')"
          : "";

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
    console.error("[getFinanzasByEmpresa] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener las finanzas de esta empresa" });
  }
};

//funcion para buscar todos los pedidos de una empresa
export const getPedidosByEmpresa = async (req, res) => {
  try {
    //el :id es el empresa_id, compruebo que coincida con el del JWT
    if (!assertEmpresaIdParam(req, res, "id")) return;

    const { id } = req.params;

    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.empresa_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [id] },
    );

    res.status(200).json(pedidos);
  } catch (error) {
    console.error("[getPedidosByEmpresa] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de esta empresa" });
  }
};

//funcion para comprobar si ya existe un pedido vinculado a un presupuesto
//lo uso desde el detalle del presupuesto para deshabilitar el boton de "convertir a pedido"
export const existePedidoDePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findOne({ where: { presupuesto_id: id } });

    //si existe pedido pero es de otra empresa devuelvo { existe: false } para no filtrar info
    if (pedido && !esSuperadmin(req)) {
      if (String(pedido.empresa_id) !== String(req.user.empresa_id)) {
        return res.status(200).json({ existe: false });
      }
    }

    res.status(200).json({ existe: !!pedido });
  } catch (error) {
    console.error("[existePedidoDePresupuesto] error:", error);
    res.status(500).json({ message: "Error al comprobar el pedido" });
  }
};

//funcion para añadir un pedido nuevo (normalmente al convertir un presupuesto)
export const createPedido = async (req, res) => {
  try {
    const {
      presupuesto_id,
      cliente_id,
      operario_asignado_id,
      importe_acordado,
      fecha_inicio_estimada,
      fecha_entrega_estimada,
    } = req.body;

    if (!presupuesto_id || !cliente_id || importe_acordado === undefined) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    //el empresa_id se coge del JWT, no del body
    const empresa_id = empresaIdEfectivo(req);
    if (!empresa_id) {
      return res.status(400).json({ message: "Empresa no identificada" });
    }

    //compruebo que el cliente y el operario asignado (si llega) son de la misma empresa
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente || String(cliente.empresa_id) !== String(empresa_id)) {
      return res.status(400).json({ message: "Cliente invalido para esta empresa" });
    }
    if (operario_asignado_id) {
      const op = await Usuario.findByPk(operario_asignado_id);
      if (!op || String(op.empresa_id) !== String(empresa_id)) {
        return res
          .status(400)
          .json({ message: "Operario invalido para esta empresa" });
      }
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
    console.error("[createPedido] error:", error);
    res.status(500).json({ message: "Error al crear el pedido" });
  }
};

//funcion para actualizar un pedido existente (con cambios parciales)
export const updatePedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
    //compruebo que el pedido sea de mi empresa
    if (!assertOwnsRecurso(req, res, pedido)) return;

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

    //si me cambian el cliente o el operario asignado, valido que sean de la misma empresa que el pedido
    if (cliente_id) {
      const cli = await Cliente.findByPk(cliente_id);
      if (!cli || String(cli.empresa_id) !== String(pedido.empresa_id)) {
        return res.status(400).json({ message: "Cliente invalido para esta empresa" });
      }
    }
    if (operario_asignado_id) {
      const op = await Usuario.findByPk(operario_asignado_id);
      if (!op || String(op.empresa_id) !== String(pedido.empresa_id)) {
        return res
          .status(400)
          .json({ message: "Operario invalido para esta empresa" });
      }
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

    await pedido.update(camposActualizar);

    res.status(200).json({ message: "Pedido actualizado correctamente" });
  } catch (error) {
    console.error("[updatePedido] error:", error);
    res.status(500).json({ message: "Error al actualizar el pedido" });
  }
};

//funcion para borrar un pedido
export const deletePedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
    if (!assertOwnsRecurso(req, res, pedido)) return;

    await pedido.destroy();
    res.status(200).json({ message: "Pedido borrado correctamente" });
  } catch (error) {
    console.error("[deletePedido] error:", error);
    res.status(500).json({ message: "Error al borrar el pedido" });
  }
};

//funcion para marcar un pedido como fabricado (la usa el operario desde su panel)
export const marcarComoFabricado = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
    if (!assertOwnsRecurso(req, res, pedido)) return;

    pedido.estado_fabricacion = "fabricado";
    await pedido.save();

    res
      .status(200)
      .json({ message: "Pedido marcado como fabricado correctamente" });
  } catch (error) {
    console.error("[marcarComoFabricado] error:", error);
    res
      .status(500)
      .json({ message: "Error al marcar como fabricado el pedido" });
  }
};

//funcion para obtener el historial completo de pedidos de un operario (todos los estados)
export const getPedidosHistorialByOperario = async (req, res) => {
  try {
    if (!(await validarOperarioDeMiEmpresa(req, res))) return;

    //si el que pide es un operario solo puede ver su propio historial
    if (
      req.user?.rol === "operario" &&
      String(req.user.id) !== String(req.params.id)
    ) {
      return res
        .status(403)
        .json({ message: "Solo puedes consultar tu propio historial" });
    }

    const [pedidos] = await sequelize.query(
      `
            ${PEDIDOS_WITH_CLIENTE_SELECT}
            WHERE p.operario_asignado_id = ?
            ORDER BY p.id DESC
            `,
      { replacements: [req.params.id] },
    );

    //lista vacia -> 200 + []
    res.status(200).json(pedidos);
  } catch (error) {
    console.error("[getPedidosHistorialByOperario] error:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los pedidos de este operario" });
  }
};
