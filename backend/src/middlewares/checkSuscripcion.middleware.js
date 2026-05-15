import { Empresa } from '../models/empresa.model.js';

//middleware que comprueba si la empresa del usuario autenticado tiene suscripcion activa
//requiere que autenticarToken se ejecute antes para tener req.user.empresa_id
export const checkSuscripcion = async (req, res, next) => {
  try {
    //prioridad: empresa del JWT autenticado > parametros > body > cabecera
    //asi evitamos que un usuario consulte recursos de otra empresa pasando un empresa_id distinto
    const empresa_id =
      req.user?.empresa_id ||
      req.params.empresa_id ||
      req.params.id ||
      req.body?.empresa_id ||
      req.headers['x-empresa-id'];

    //si no podemos identificar empresa, denegamos por seguridad
    if (!empresa_id) {
      return res.status(400).json({ message: "Empresa no identificada" });
    }

    //busco la empresa por el id
    const empresa = await Empresa.findByPk(empresa_id);

    //si no existe la empresa denegamos
    if (!empresa) {
      return res.status(404).json({ message: "Empresa no encontrada" });
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

    //todo correcto, dejo pasar
    next();
  } catch (error) {
    //error real del servidor -> NO dejamos pasar (cerramos el fail-open)
    console.error("[checkSuscripcion] error:", error);
    return res.status(500).json({ message: "Error al verificar la suscripción" });
  }
};
