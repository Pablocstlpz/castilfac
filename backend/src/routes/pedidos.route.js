import { Router } from 'express';
import { getPedidos, getPedidosByEmpresa, getPedidosByOperario, deletePedido } from '../controllers/pedidos.controller.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/empresa/:id', getPedidosByEmpresa);
router.get('/pedidos/operario/:id', getPedidosByOperario);
router.delete('/pedidos/:id', deletePedido);

export { router as pedidosRoutes };