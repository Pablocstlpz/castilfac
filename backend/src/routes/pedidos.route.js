import { Router } from 'express';
import { getPedidos, getPedidosByEmpresa, getPedidosByOperario, deletePedido, marcarComoFabricado, getPedidosHistorialByOperario } from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/empresa/:id', getPedidosByEmpresa);
router.get('/pedidos/operario/:id', getPedidosByOperario);
router.delete('/pedidos/:id', deletePedido);
router.put('/pedidos/marcar-fabricado/:id', marcarComoFabricado);
router.get('/pedidos/historial/operario/:id', getPedidosHistorialByOperario);

export { router as pedidosRoutes };