//Helpers de aislamiento multi-tenant.
//Todo lo que sigue asume que la peticion ya paso por autenticarToken,
//por lo que req.user tiene { id, rol, empresa_id }.

const esSuperadmin = (req) => req.user?.rol === "superadmin";

//Comprueba que el empresa_id que viene en la URL (parametro :empresa_id o :id segun
//el nombre que use la ruta) coincide con el empresa_id del JWT.
//Si la peticion es de superadmin se permite acceso a cualquier empresa.
//
//Si la comprobacion falla envia la respuesta (404 o 403) y devuelve false; el
//controlador debe hacer "if (!assertEmpresaIdParam(req, res)) return;".
export const assertEmpresaIdParam = (req, res, nombreParam = "empresa_id") => {
  const empresaIdParam = req.params[nombreParam];

  if (!empresaIdParam) {
    res.status(400).json({ message: "Falta el ID de empresa en la URL" });
    return false;
  }

  if (esSuperadmin(req)) return true;

  //Comparamos como string para evitar problemas entre "12" del path y 12 del JWT.
  if (String(empresaIdParam) !== String(req.user.empresa_id)) {
    res
      .status(403)
      .json({ message: "No tienes permiso para acceder a esta empresa" });
    return false;
  }
  return true;
};

//Comprueba que un recurso devuelto por Sequelize pertenece a la empresa del JWT.
//Pensado para usar despues de un findByPk: si el id existe pero la empresa no
//coincide, mentimos con un 404 para no filtrar la existencia del id ajeno.
export const assertOwnsRecurso = (req, res, recurso, campo = "empresa_id") => {
  if (!recurso) {
    res.status(404).json({ message: "Recurso no encontrado" });
    return false;
  }

  if (esSuperadmin(req)) return true;

  const empresaRecurso = recurso[campo];
  if (String(empresaRecurso) !== String(req.user.empresa_id)) {
    //Devolvemos 404 a proposito (en vez de 403) para no revelar que el id existe
    //en otra empresa. Se evita asi enumeracion cruzada.
    res.status(404).json({ message: "Recurso no encontrado" });
    return false;
  }
  return true;
};

//Devuelve el empresa_id efectivo de la peticion: si el body intenta colar uno
//distinto, lo ignoramos y devolvemos el del JWT. Util al crear recursos para
//no fiarse de empresa_id que llegue del cliente.
export const empresaIdEfectivo = (req) => {
  if (esSuperadmin(req) && req.body?.empresa_id) {
    //Solo un superadmin puede crear recursos para empresas que no son la suya.
    return req.body.empresa_id;
  }
  return req.user?.empresa_id;
};

export { esSuperadmin };
