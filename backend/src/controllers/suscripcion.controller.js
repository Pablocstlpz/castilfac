import { Empresa } from '../models/empresa.model.js';

export const verificarSuscripcion = async (req, res) => {
  try {
    //recojo el id de la empresa de la URL
    const { empresa_id } = req.params;

    //valido que el id de la empresa sea requerido
    if (!empresa_id) {
      return res.status(400).json({ message: "El ID de empresa es requerido" });
    }

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
