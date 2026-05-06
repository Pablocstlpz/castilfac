import { Empresa } from '../models/empresa.model.js';

export const verificarSuscripcion = async (req, res) => {
  try {
    const { empresa_id } = req.params;

    if (!empresa_id) {
      return res.status(400).json({ message: 'El ID de empresa es requerido' });
    }

    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const ahora = new Date();
    const fechaVencimiento = empresa.fecha_vencimiento
      ? new Date(empresa.fecha_vencimiento)
      : null;

    const trialExpirado = !empresa.suscripcion_activa && (!fechaVencimiento || ahora > fechaVencimiento);

    const diasRestantes = fechaVencimiento
      ? Math.max(0, Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24)))
      : 0;

    res.status(200).json({
      suscripcion_activa: empresa.suscripcion_activa,
      trial_expirado: trialExpirado,
      fecha_vencimiento: empresa.fecha_vencimiento,
      dias_restantes: diasRestantes,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error al verificar la suscripción' });
  }
};
