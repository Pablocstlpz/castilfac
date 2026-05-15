import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  // Usamos sessionStorage en lugar de localStorage por motivos de seguridad:
  // los datos de sesión se eliminan automáticamente al cerrar la pestaña o el navegador,
  // lo que reduce el riesgo de que otro usuario en el mismo equipo acceda a la sesión.

  // Claves de almacenamiento separadas:
  //   - 'usuario_castilfac': perfil del usuario (sin password)
  //   - 'token_castilfac':   accessToken JWT que el interceptor inyecta en cada request
  private static readonly USER_KEY = 'usuario_castilfac';
  private static readonly TOKEN_KEY = 'token_castilfac';

  // guardar la sesion completa devuelta por el backend: { accessToken, usuario }
  // Si por algun motivo solo recibimos el usuario (compatibilidad), guardamos solo eso.
  guardarSesion(payload: { accessToken?: string; usuario?: any } | any): void {
    // formato nuevo: { accessToken, usuario }
    if (payload && payload.accessToken && payload.usuario) {
      // Defensivo: nos aseguramos de que el password no acabe en sessionStorage
      // aunque el backend ya filtra el hash via Usuario.toJSON()
      const { password: _hashDescartado, ...datosSesion } = payload.usuario;
      sessionStorage.setItem(Authentication.USER_KEY, JSON.stringify(datosSesion));
      sessionStorage.setItem(Authentication.TOKEN_KEY, payload.accessToken);
      return;
    }

    // formato antiguo (objeto Usuario plano)
    this.guardarUsuarioSesion(payload);
  }

  // guardar usuario en sessionStorage (sin contraseña) - mantengo nombre antiguo
  // para no romper componentes que ya llamaban a este metodo.
  guardarUsuarioSesion(usuario: any): void {
    if (!usuario) return;
    const { password: _hashDescartado, ...datosSesion } = usuario;
    sessionStorage.setItem(Authentication.USER_KEY, JSON.stringify(datosSesion));
  }

  // obtener usuario de sessionStorage
  obtenerUsuarioSesion(): any {
    const usuarioTexto = sessionStorage.getItem(Authentication.USER_KEY);
    if (!usuarioTexto) return null;
    try {
      return JSON.parse(usuarioTexto);
    } catch {
      // si el JSON esta corrupto limpiamos para evitar bucles
      this.cerrarSesion();
      return null;
    }
  }

  // obtener el accessToken JWT actual (lo usa el interceptor)
  obtenerToken(): string | null {
    return sessionStorage.getItem(Authentication.TOKEN_KEY);
  }

  // cerrar sesion y limpiar todo rastro de actividad del usuario.
  // sessionStorage.clear() borra TODAS las claves de la pestaña, incluido el token.
  cerrarSesion(): void {
    sessionStorage.clear();
  }
}
