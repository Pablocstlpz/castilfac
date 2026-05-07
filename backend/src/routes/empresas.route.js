"use strict"

import { Router } from 'express';
import { getEmpresas, getEmpresa, createEmpresa, updateEmpresa, deleteEmpresa, getEmpresaByNif, deleteEmpresaCorreo, verificarEmailEmpresa, reenviarVerificacionEmpresa } from '../controllers/empresas.controller.js';

const router = Router();

router.get('/empresas', getEmpresas);
router.get('/empresas/nif/:nif', getEmpresaByNif);
router.get('/empresas/verificar/:token', verificarEmailEmpresa);
router.get('/empresas/:id', getEmpresa);
router.post('/empresas', createEmpresa);
router.post('/empresas/reenviar-verificacion', reenviarVerificacionEmpresa);
router.put('/empresas/:id', updateEmpresa);
router.delete('/empresas/:id', deleteEmpresa);
router.delete('/empresas/correo/:correo', deleteEmpresaCorreo);

export { router as empresasRoutes };