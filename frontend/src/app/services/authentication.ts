import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  // Usamos sessionStorage en lugar de localStorage por motivos de seguridad:
  // los datos de sesión se eliminan al cerrar la pestaña / navegador, lo que
  // reduce el riesgo de que otro usuario en el mismo equipo acceda a la sesión.

  // Claves en sessionStorage:
  //   - usuario_castilfac: perfil del usuario (sin password)
  //   - token_castilfac:   accessToken JWT (15 min) -> interceptor lo manda en cada peticion
  //   - refresh_castilfac: refreshToken (7 dias)    -> se cambia por uno nuevo via POST /auth/refresh
  private static readonly USER_KEY = 'usuario_castilfac';
  private static readonly TOKEN_KEY = 'token_castilfac';
  private static readonly REFRESH_KEY = 'refresh_castilfac';

  // Guarda la sesion completa devuelta por el backend.
  // Acepta dos formatos:
  //   { accessToken, refreshToken, usuario }  (login/loginGoogle, Bloque 6)
  //   { accessToken, usuario }                (compatibilidad bloques 1-5)
  //   usuario plano                           (legacy)
  guardarSesion(payload: { accessToken?: string; refreshToken?: string; usuario?: any } | any): void {
    if (payload && payload.accessToken && payload.usuario) {
      // Defensivo: nos aseguramos de que el password no acabe en sessionStorage
      const { password: _hashDescartado, ...datosSesion } = payload.usuario;
      sessionStorage.setItem(Authentication.USER_KEY, JSON.stringify(datosSesion));
      sessionStorage.setItem(Authentication.TOKEN_KEY, payload.accessToken);
      if (payload.refreshToken) {
        sessionStorage.setItem(Authentication.REFRESH_KEY, payload.refreshToken);
      }
      return;
    }
    // formato antiguo (objeto Usuario plano)
    this.guardarUsuarioSesion(payload);
  }

  // Mantengo el nombre antiguo para no romper componentes existentes.
  guardarUsuarioSesion(usuario: any): void {
    if (!usuario) return;
    const { password: _hashDescartado, ...datosSesion } = usuario;
    sessionStorage.setItem(Authentication.USER_KEY, JSON.stringify(datosSesion));
  }

  // Llamado por el interceptor cuando recibe del backend nuevos tokens tras
  // un /auth/refresh exitoso. Mantiene el resto de la sesion intacta.
  actualizarTokens(tokens: { accessToken: string; refreshToken?: string }): void {
    sessionStorage.setItem(Authentication.TOKEN_KEY, tokens.accessToken);
    if (tokens.refreshToken) {
      sessionStorage.setItem(Authentication.REFRESH_KEY, tokens.refreshToken);
    }
  }

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

  obtenerToken(): string | null {
    return sessionStorage.getItem(Authentication.TOKEN_KEY);
  }

  obtenerRefreshToken(): string | null {
    return sessionStorage.getItem(Authentication.REFRESH_KEY);
  }

  cerrarSesion(): void {
    // sessionStorage.clear() borra TODAS las claves de la pestaña, incluido el
    // refresh. Es lo que queremos al cerrar sesion explicitamente.
    sessionStorage.clear();
  }
}
