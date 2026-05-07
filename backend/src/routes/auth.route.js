"use strict"

import { Router } from 'express';
import { loginGoogle } from '../controllers/auth.controller.js';

const router = Router();

router.post('/auth/google', loginGoogle);

export { router as authRoutes };
