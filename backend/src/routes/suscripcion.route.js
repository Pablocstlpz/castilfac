"use strict";

import { Router } from "express";
import { verificarSuscripcion } from "../controllers/suscripcion.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";

const router = Router();

//Consultar la suscripcion requiere estar autenticado pero NO tener suscripcion
//activa (precisamente este endpoint sirve para saber si la hay).
router.use("/suscripcion", autenticarToken);

router.get("/suscripcion/check/:empresa_id", verificarSuscripcion);

export { router as suscripcionRoutes };
