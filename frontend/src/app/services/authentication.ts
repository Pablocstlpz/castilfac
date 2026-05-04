import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Authentication {

  // Usamos sessionStorage en lugar de localStorage por motivos de seguridad:
  // los datos de sesión se eliminan automáticamente al cerrar la pestaña o el navegador,
  // lo que reduce el riesgo de que otro usuario en el mismo equipo acceda a la sesión.

  // guardar usuario en sessionStorage (sin contraseña)
  guardarUsuarioSesion(usuario: any): void {
    // Extraemos el campo password del objeto antes de guardarlo,
    // ya que el backend nos devuelve el hash bcrypt y no lo necesitamos
    // en el cliente para ninguna operación de UI.
    const { password: _hashDescartado, ...datosSesion } = usuario;

    // Convertimos los datos de sesión (sin contraseña) a texto para poder guardarlos
    const usuarioTexto = JSON.stringify(datosSesion);
    sessionStorage.setItem('usuario_castilfac', usuarioTexto);
  }

  // obtener usuario de sessionStorage
  obtenerUsuarioSesion(): any {
    // Recuperamos los datos de sesión almacenados en sessionStorage
    const usuarioTexto = sessionStorage.getItem('usuario_castilfac');

    if (usuarioTexto) {
      // Parseamos el texto JSON para devolverlo como objeto utilizable
      return JSON.parse(usuarioTexto);
    } else {
      // Si no hay sesión activa, devolvemos null para que los componentes
      // puedan redirigir al usuario a la página de login o de no permisos
      return null;
    }
  }

  // cerrar sesión y limpiar todo rastro de actividad del usuario
  cerrarSesion(): void {
    // Usamos sessionStorage.clear() en lugar de removeItem para asegurarnos
    // de que no queda ningún dato de la sesión en el almacenamiento del navegador,
    // independientemente de las claves que se hayan podido guardar.
    sessionStorage.clear();
  }

}
