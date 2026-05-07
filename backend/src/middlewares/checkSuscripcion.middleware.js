import { Empresa } from '../models/empresa.model.js';

export const checkSuscripcion = async (req, res, next) => {
  try {
    //intento obtener el id de la empresa desde los parametros, el body o la cabecera
    const empresa_id =
      req.params.empresa_id ||
      req.params.id ||
      req.body?.empresa_id ||
      req.headers['x-empresa-id'];

    //si no hay empresa_id dejo pasar la peticion
    if (!empresa_id) {
      return next();
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //si no existe la empresa dejo pasar la peticion
    if (!empresa) {
      return next();
    }

    //compruebo si la suscripcion esta activa
    if (!empresa.suscripcion_activa) {
      //recojo la fecha de vencimiento de la empresa
      const ahora = new Date();
      const fechaVencimiento = empresa.fecha_vencimiento
        ? new Date(empresa.fecha_vencimiento)
        : null;

      //si el trial ha vencido devuelvo un error 403
      if (!fechaVencimiento || ahora > fechaVencimiento) {
        return res.status(403).json({
          message: "Suscripción requerida. Tu prueba gratuita ha finalizado.",
          tipo: "SUSCRIPCION_REQUERIDA",
        });
      }
    }

    //si todo esta bien dejo pasar la peticion
    next();
  } catch (error) {
    //muestro el error por consola
    console.log(error);
    //dejo pasar la peticion para no bloquear la aplicacion
    next();
  }
};
