"use strict"

import { Router } from 'express';
import { getEmpresas, getEmpresa, createEmpresa, updateEmpresa, deleteEmpresa, getEmpresaByNif, deleteEmpresaCorreo } from '../controllers/empresas.controller.js';

const router = Router();

router.get('/empresas', getEmpresas);
router.get('/empresas/nif/:nif', getEmpresaByNif);  // más específica primero
router.get('/empresas/:id', getEmpresa);
router.post('/empresas', createEmpresa);
router.put('/empresas/:id', updateEmpresa);
router.delete('/empresas/:id', deleteEmpresa);
router.delete('/empresas/correo/:correo', deleteEmpresaCorreo); 

export { router as empresasRoutes };