import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Usuario } from '../interfaces/usuario';

import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/enviroments';

@Injectable({
  providedIn: 'root',
})

export class UsuariosServices {
  private URL = environment.apiUrl;

  private httpOptions = {

    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    })
  };

  private http = inject(HttpClient);


  getUsuarios(): Observable<Usuario[]> { // El método getUsuarios devuelve un Observable que emitirá un array de objetos Usuario. Este método se encarga de realizar una petición GET al endpoint correspondiente para obtener la lista de usuarios.  
    return this.http.get<Usuario[]>(`${this.URL}/usuarios`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un array de Usuario
      catchError(this.handleError)
    );
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.URL}/usuarios/${id}`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un objeto Usuario
      catchError(this.handleError)
    );
  }

  //RECORDAR QUE ÑAS URL QUE HAY AQUI SON LAS DE LAS RUTAS DEL BACKEND PARA ACCEDER A LOS DATOS, EN EL FRONTEND NO SE USAN
  getUsuarioPorEmpresa(empresa_id: number): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.URL}/usuarios/empresa/${empresa_id}`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un array de Usuario
      catchError(this.handleError)
    );
  }

  addUsuario(usuario: Usuario): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.URL}/usuarios`, usuario, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  updateUsuario(usuario: Usuario): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.URL}/usuarios/${usuario.id}`, usuario, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  //deleteUsuario(id: string): Observable<Usuario> {
  deleteUsuario(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL}/usuarios/${id}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  deleteUsuarioCorreo(correo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL}/usuarios/correo/${correo}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  // El backend devuelve el objeto Usuario directamente (sin wrapper), por eso el tipo es Observable<Usuario>
  getUsuarioCorreoContraseña(correo: string, contraseña: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.URL}/usuarios/login`, { correo, contraseña }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  solicitarRecuperacion(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.URL}/usuarios/recuperar-password`, { email }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  restablecerPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.URL}/usuarios/restablecer-password`, { token, password }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  loginConGoogle(credential: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.URL}/auth/google`, { credential }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
