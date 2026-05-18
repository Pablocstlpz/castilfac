import { Empresa } from '../models/empresa.model.js';
import { assertEmpresaIdParam } from "../utils/tenant.js";
import { logger } from "../utils/logger.js";

//funcion para comprobar el estado de la suscripcion de una empresa
export const verificarSuscripcion = async (req, res) => {
  try {
    //compruebo que el empresa_id de la URL coincide con el del JWT (salvo superadmin)
    //asi nadie puede consultar el estado de suscripcion de una empresa que no sea la suya
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const { empresa_id } = req.params;

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //si no existe la empresa devuelvo 404
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
    }

    //calculo si el trial ha expirado
    const ahora = new Date();
    const fechaVencimiento = empresa.fecha_vencimiento
      ? new Date(empresa.fecha_vencimiento)
      : null;

    const trialExpirado =
      !empresa.suscripcion_activa && (!fechaVencimiento || ahora > fechaVencimiento);

    //calculo los dias que le quedan al trial
    const diasRestantes = fechaVencimiento
      ? Math.max(0, Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24)))
      : 0;

    //devuelvo la informacion completa de la suscripcion al frontend
    res.status(200).json({
      suscripcion_activa: empresa.suscripcion_activa,
      trial_expirado: trialExpirado,
      fecha_vencimiento: empresa.fecha_vencimiento,
      dias_restantes: diasRestantes,
    });
  } catch (error) {
    logger.error("verificarSuscripcion", error);
    res.status(500).json({ message: "Error al verificar la suscripción" });
  }
};
