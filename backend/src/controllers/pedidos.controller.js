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

const PEDIDOS_WITH_CLIENTE_SELECT = `
    SELECT
        p.*,
        c.nombre_empresa_o_particular AS cliente_nombre,
        c.direccion AS cliente_direccion
    FROM pedidos p
    INNER JOIN clientes c ON c.id = p.cliente_id
`;

//Helper local: comprueba que el usuario con id == :id pertenece a la misma empresa
//que el del JWT. Util para getPedidosByOperario / getPedidosHistorialByOperario.
const validarOperarioDeMiEmpresa = async (req, res) => {
  if (esSuperadmin(req)) return true;
  const operario = await Usuario.findByPk(req.params.id);
  if (!operario || String(operario.empresa_id) !== String(req.user.empresa_id)) {
    res.status(404).json({ message: "Operario no encontrado" });
    return false;
  }
  return true;
};

//Idem para cliente.
const validarClienteDeMiEmpresa = async (req, res) => {
  if (esSuperadmin(req)) return true;
  const cliente = await Cliente.findByPk(req.params.id);
  if (!cliente || String(cliente.empresa_id) !== String(req.user.empresa_id)) {
    res.status(404).json({ message: "Cliente no encontrado" });
    return false;
  }
  return true;
};

//OBTENER TODOS LOS PEDIDOS (solo superadmin via autorizarRol en la ruta)
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

//OBTENER PEDIDO POR SU ID
export const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    //Buscamos primero con Sequelize para poder validar empresa antes de devolver datos.
    const pedido = await Pedido.findByPk(id);
    if (!assertOwnsRecurso(req, res, pedido)) return;

    //Si pasa el filtro, recuperamos el row enriquecido con cliente via SQL crudo.
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

//BUSCAR PEDIDOS POR OPERARIO (operarios solo ven los suyos, admins ven los de su empresa)
export const getPedidosByOperario = async (req, res) => {
  try {
    //Tenant: el operario pedido debe ser de la misma empresa que el del JWT.
    if (!(await validarOperarioDeMiEmpresa(req, res))) return;

    //Si el solicitante es un operario, solo puede pedir SUS propios pedidos.
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

    if (pedidos.length === 0) return res.status(200).json([]);

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

//BUSCAR PEDIDOS POR CLIENTE
export const getPedidosByCliente = async (req, res) => {
  try {
    //Tenant: el cliente debe pertenecer a mi empresa.
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

//OBTENER DATOS FINANCIEROS DE UNA EMPRESA (con filtro temporal opcional)
export const getFinanzasByEmpresa = async (req, res) => {
  try {
    //Tenant: el :id es empresa_id; debe coincidir con el del JWT.
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

//BUSCAR PEDIDOS POR EMPRESA
export const getPedidosByEmpresa = async (req, res) => {
  try {
    //Tenant: el :id es empresa_id; debe coincidir con el del JWT.
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

//COMPROBAR SI EXISTE PEDIDO PARA UN PRESUPUESTO
export const existePedidoDePresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findOne({ where: { presupuesto_id: id } });

    //Tenant: si existe pedido, debe ser de mi empresa para evitar filtraciones.
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

//AÑADIR PEDIDO
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

    //empresa_id se toma del JWT, no del body.
    const empresa_id = empresaIdEfectivo(req);
    if (!empresa_id) {
      return res.status(400).json({ message: "Empresa no identificada" });
    }

    //Comprobamos que cliente y operario (si vienen) son de la misma empresa.
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

//ACTUALIZAR PEDIDO
export const updatePedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
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

    //Si se cambia cliente / operario, validamos que sean de la misma empresa.
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

//BORRAR PEDIDO
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

//MARCAR COMO FABRICADO
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

//OBTENER HISTORIAL COMPLETO DE PEDIDOS DE UN OPERARIO
export const getPedidosHistorialByOperario = async (req, res) => {
  try {
    if (!(await validarOperarioDeMiEmpresa(req, res))) return;

    //Si el solicitante es operario, solo su propio historial.
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
