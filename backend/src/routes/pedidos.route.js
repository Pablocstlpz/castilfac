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
  getFinanzasByEmpresa,
  createPedido,
  existePedidoDePresupuesto,
} from "../controllers/pedidos.controller.js";
import { autenticarToken, autorizarRol } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";

const router = Router();

//Todas las rutas de pedidos requieren JWT y suscripcion vigente.
router.use(autenticarToken, checkSuscripcion);

// las rutas especificas van antes que /pedidos/:id para que express no las capture como id
router.get("/pedidos", autorizarRol(["superadmin"]), getPedidos);
router.get("/pedidos/finanzas/empresa/:id", getFinanzasByEmpresa);
router.get("/pedidos/empresa/:id", getPedidosByEmpresa);
router.get("/pedidos/operario/:id", getPedidosByOperario);
router.get("/pedidos/cliente/:id", getPedidosByCliente);
router.get("/pedidos/historial/operario/:id", getPedidosHistorialByOperario);
router.get("/pedidos/:id", getPedidoById);
router.post("/pedidos", createPedido);
router.get("/pedidos/presupuesto/:id", existePedidoDePresupuesto);
router.put("/pedidos/marcar-fabricado/:id", marcarComoFabricado);
router.put("/pedidos/:id", updatePedido);
router.delete("/pedidos/:id", deletePedido);

export { router as pedidosRoutes };
