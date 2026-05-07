import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Empresa } from '../interfaces/empresa';

import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../environments/enviroments';

@Injectable({
  providedIn: 'root',
})

export class EmpresasServices {
  private URL = environment.apiUrl;

  private httpOptions = {

    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    })
  };

  private http = inject(HttpClient);


  getEmpresas(): Observable<Empresa[]> { // El método getUsuarios devuelve un Observable que emitirá un array de objetos Usuario. Este método se encarga de realizar una petición GET al endpoint correspondiente para obtener la lista de usuarios.  
    return this.http.get<Empresa[]>(`${this.URL}/empresas`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un array de Usuario
      catchError(this.handleError)
    );
  }

  getEmpresa(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.URL}/empresas/${id}`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un objeto Usuario
      catchError(this.handleError)
    );
  }

  getEmpresaByNif(nif: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.URL}/empresas/nif/${nif}`).pipe(
      map(response => response), // Aseguramos que la respuesta se trate como un objeto Usuario
      catchError(this.handleError)
    );
  }

  addEmpresa(empresa: Empresa): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.URL}/empresas`, empresa, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  updateEmpresa(empresa: Empresa): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.URL}/empresas/${empresa.id}`, empresa, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  //deleteUsuario(id: string): Observable<Usuario> {
  deleteEmpresa(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL}/empresas/${id}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  deleteEmpresaCorreo(correo: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.URL}/empresas/correo/${correo}`, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  reenviarVerificacion(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.URL}/empresas/reenviar-verificacion`, { email }, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
