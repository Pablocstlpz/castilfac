import { Empresa } from '../models/empresa.model.js';
import { assertEmpresaIdParam } from "../utils/tenant.js";

export const verificarSuscripcion = async (req, res) => {
  try {
    //Tenant: empresa_id de la URL debe coincidir con el del JWT (excepto superadmin).
    if (!assertEmpresaIdParam(req, res, "empresa_id")) return;

    const { empresa_id } = req.params;

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //valido que la empresa exista
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

    //calculo los dias restantes del trial
    const diasRestantes = fechaVencimiento
      ? Math.max(0, Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24)))
      : 0;

    //devuelvo la informacion de la suscripcion
    res.status(200).json({
      suscripcion_activa: empresa.suscripcion_activa,
      trial_expirado: trialExpirado,
      fecha_vencimiento: empresa.fecha_vencimiento,
      dias_restantes: diasRestantes,
    });
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //devuelvo un mensaje de error
    res.status(500).json({ message: "Error al verificar la suscripción" });
  }
};
