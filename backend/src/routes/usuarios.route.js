"use strict"

import { Router } from 'express';
import { getUsuarios, getUsuario, createUsuario, updateUsuario, deleteUsuario, deleteUsuarioCorreo, getUsuarioCorreoContraseña } from '../controllers/usuarios.controller.js';

const router = Router();

router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuario);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);
router.delete('/usuarios/correo/:correo', deleteUsuarioCorreo);
router.post('/usuarios/login', getUsuarioCorreoContraseña);

export { router as usuariosRoutes };