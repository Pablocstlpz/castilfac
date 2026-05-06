import { Empresa } from '../models/empresa.model.js';

export const checkSuscripcion = async (req, res, next) => {
  try {
    const empresa_id =
      req.params.empresa_id ||
      req.params.id ||
      req.body?.empresa_id ||
      req.headers['x-empresa-id'];

    if (!empresa_id) return next();

    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) return next();

    if (!empresa.suscripcion_activa) {
      const ahora = new Date();
      const fechaVencimiento = empresa.fecha_vencimiento
        ? new Date(empresa.fecha_vencimiento)
        : null;

      if (!fechaVencimiento || ahora > fechaVencimiento) {
        return res.status(403).json({
          message: 'Suscripción requerida. Tu prueba gratuita ha finalizado.',
          tipo: 'SUSCRIPCION_REQUERIDA',
        });
      }
    }

    next();
  } catch (error) {
    console.log(error);
    next();
  }
};
