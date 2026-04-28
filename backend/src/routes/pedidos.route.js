import { Router } from "express";
import {
  getPedidos,
  getPedidosByEmpresa,
  getPedidosByOperario,
  getPedidosByCliente,
  deletePedido,
  updatePedido,
  marcarComoFabricado,
  getPedidosHistorialByOperario,
  getPedidoById,
} from "../controllers/pedidos.controller.js";

const router = Router();

// las rutas especificas van antes que /pedidos/:id para que express no las capture como id
router.get("/pedidos", getPedidos);
router.get("/pedidos/empresa/:id", getPedidosByEmpresa);
router.get("/pedidos/operario/:id", getPedidosByOperario);
router.get("/pedidos/cliente/:id", getPedidosByCliente);
router.get("/pedidos/historial/operario/:id", getPedidosHistorialByOperario);
router.get("/pedidos/:id", getPedidoById);
router.put("/pedidos/marcar-fabricado/:id", marcarComoFabricado);
router.put("/pedidos/:id", updatePedido);
router.delete("/pedidos/:id", deletePedido);

export { router as pedidosRoutes };
