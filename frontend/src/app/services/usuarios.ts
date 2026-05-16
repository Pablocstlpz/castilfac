import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Usuario } from '../interfaces/usuario';
import { BaseHttpService } from './base-http.service';

/**
 * Servicio de usuarios. Migrado a BaseHttpService:
 *   - Sin httpOptions manuales (los headers ya los pone Angular para JSON;
 *     el authInterceptor se encarga del Bearer).
 *   - Sin handleError local (lo hereda).
 *   - URLs relativas al apiUrl que vive en environment.
 */
@Injectable({ providedIn: 'root' })
export class UsuariosServices extends BaseHttpService {
  getUsuarios(): Observable<Usuario[]> {
    return this.get<Usuario[]>('/usuarios');
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.get<Usuario>(`/usuarios/${id}`);
  }

  getUsuarioPorEmpresa(empresa_id: number): Observable<Usuario[]> {
    return this.get<Usuario[]>(`/usuarios/empresa/${empresa_id}`);
  }

  addUsuario(usuario: Usuario): Observable<{ id: string }> {
    return this.post<{ id: string }>('/usuarios', usuario);
  }

  updateUsuario(usuario: Usuario): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/usuarios/${usuario.id}`, usuario);
  }

  deleteUsuario(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/usuarios/${id}`);
  }

  deleteUsuarioCorreo(correo: string): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/usuarios/correo/${correo}`);
  }

  // Login tradicional: backend devuelve { accessToken, usuario }
  getUsuarioCorreoContraseña(
    correo: string,
    contraseña: string,
  ): Observable<{ accessToken: string; usuario: Usuario }> {
    return this.post<{ accessToken: string; usuario: Usuario }>(
      '/usuarios/login',
      { correo, contraseña },
    );
  }

  solicitarRecuperacion(email: string): Observable<{ message: string }> {
    return this.post<{ message: string }>('/usuarios/recuperar-password', { email });
  }

  restablecerPassword(token: string, password: string): Observable<{ message: string }> {
    return this.post<{ message: string }>('/usuarios/restablecer-password', {
      token,
      password,
    });
  }

  // Login con Google: misma forma { accessToken, usuario }
  loginConGoogle(
    credential: string,
  ): Observable<{ accessToken: string; usuario: Usuario }> {
    return this.post<{ accessToken: string; usuario: Usuario }>('/auth/google', {
      credential,
    });
  }

  // Registro inicial: crea el primer admin de una empresa recien dada de alta.
  // Endpoint publico que reemplaza al POST /usuarios para el flujo de registro,
  // porque POST /usuarios ahora exige JWT de admin.
  registroInicial(
    usuario: Usuario,
  ): Observable<{ message: string; usuario: Usuario }> {
    return this.post<{ message: string; usuario: Usuario }>(
      '/usuarios/registro-inicial',
      usuario,
    );
  }
}
