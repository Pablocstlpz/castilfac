"use strict";

import { Router } from "express";
import {
  obtenerMateriales,
  obtenerMaterialesConPrecioEmpresa,
  obtenerMaterialPorId,
  toggleActivoMaterial,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
} from "../controllers/materiales.controller.js";
import { autenticarToken } from "../middlewares/auth.middleware.js";
import { checkSuscripcion } from "../middlewares/checkSuscripcion.middleware.js";
import {
  validarCrearMaterial,
  validarActualizarMaterial,
  validarIdParam,
  validarEmpresaIdParam,
} from "../validators/materiales.validator.js";

const router = Router();

//todas las rutas de materiales requieren JWT y suscripcion vigente
router.use(autenticarToken, checkSuscripcion);

//listado enriquecido con categoria y precio empresa (para el catalogo y la tabla de precios)
router.get(
  "/materiales/empresa/:empresa_id",
  validarEmpresaIdParam,
  obtenerMaterialesConPrecioEmpresa,
);

//listado base sin enriquecer (para los select de los formularios)
router.get(
  "/materiales/empresa/:empresa_id/lista",
  validarEmpresaIdParam,
  obtenerMateriales,
);

//CRUD individual: todos los endpoints llevan :empresa_id en la URL para garantizar el aislamiento
router.get(
  "/materiales/empresa/:empresa_id/:id",
  validarIdParam,
  obtenerMaterialPorId,
);
router.post(
  "/materiales/empresa/:empresa_id",
  validarCrearMaterial,
  crearMaterial,
);
router.put(
  "/materiales/empresa/:empresa_id/:id",
  validarActualizarMaterial,
  actualizarMaterial,
);
router.delete(
  "/materiales/empresa/:empresa_id/:id",
  validarIdParam,
  eliminarMaterial,
);
router.patch(
  "/materiales/empresa/:empresa_id/:id/activo",
  validarIdParam,
  toggleActivoMaterial,
);

export { router as materialesRoutes };
