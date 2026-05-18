//helpers para el aislamiento multi-tenant
//todos asumen que la peticion ya paso por autenticarToken, por lo que req.user tiene { id, rol, empresa_id }

//funcion para saber si el usuario es superadmin (asi se salta los checks de empresa)
const esSuperadmin = (req) => req.user?.rol === "superadmin";

//funcion para validar que el empresa_id de la URL coincide con el del JWT
//acepta el nombre del param (suele ser "empresa_id" o "id") segun como este declarada la ruta
//si no coincide manda la respuesta de error y devuelve false; el controller hace "if (!assertEmpresaIdParam(req, res)) return;"
export const assertEmpresaIdParam = (req, res, nombreParam = "empresa_id") => {
  const empresaIdParam = req.params[nombreParam];

  //si la URL no trae el param es un 400 (mal montada la ruta o falta el id)
  if (!empresaIdParam) {
    res.status(400).json({ message: "Falta el ID de empresa en la URL" });
    return false;
  }

  //si es superadmin lo dejo pasar a cualquier empresa
  if (esSuperadmin(req)) return true;

  //comparo como string por si llega "12" del path y 12 del JWT
  if (String(empresaIdParam) !== String(req.user.empresa_id)) {
    res
      .status(403)
      .json({ message: "No tienes permiso para acceder a esta empresa" });
    return false;
  }
  return true;
};

//funcion para validar que un recurso recuperado por findByPk pertenece a la empresa del JWT
//si el id existe pero es de otra empresa devuelvo 404 a proposito para no filtrar la existencia del id ajeno
export const assertOwnsRecurso = (req, res, recurso, campo = "empresa_id") => {
  if (!recurso) {
    res.status(404).json({ message: "Recurso no encontrado" });
    return false;
  }

  if (esSuperadmin(req)) return true;

  const empresaRecurso = recurso[campo];
  if (String(empresaRecurso) !== String(req.user.empresa_id)) {
    //devuelvo 404 en vez de 403 para evitar enumeracion cruzada entre empresas
    res.status(404).json({ message: "Recurso no encontrado" });
    return false;
  }
  return true;
};

//funcion para obtener el empresa_id correcto al crear un recurso
//si un usuario normal manda otro empresa_id en el body lo ignoro y uso el del JWT
//solo el superadmin puede crear recursos en empresas distintas a la suya
export const empresaIdEfectivo = (req) => {
  if (esSuperadmin(req) && req.body?.empresa_id) {
    return req.body.empresa_id;
  }
  return req.user?.empresa_id;
};

export { esSuperadmin };
