"use strict"

import { Router } from 'express';
import {
    getUsuarios, getUsuario, createUsuario, updateUsuario,
    deleteUsuario, deleteUsuarioCorreo, getUsuarioCorreoContraseña, getUsuarioPorEmpresa
} from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuario);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);
router.delete('/usuarios/correo/:correo', deleteUsuarioCorreo);
router.post('/usuarios/login', getUsuarioCorreoContraseña);
router.get('/usuarios/empresa/:empresa_id', getUsuarioPorEmpresa);

export { router as usuariosRoutes };