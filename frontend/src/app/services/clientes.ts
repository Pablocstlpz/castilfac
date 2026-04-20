import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';
import { Cliente } from '../interfaces/cliente';

@Injectable({
  providedIn: 'root',
})
export class ClientesServices {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //getCliente(id: string): Observable<Cliente> {
  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.URL}/clientes/id/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un objeto Cliente
      catchError(this.handleError),
    );
  }

  //getClientePorEmpresa(empresa_id: number): Observable<Cliente[]> {
  getClientePorEmpresa(empresa_id: number): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.URL}/clientes/${empresa_id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Cliente
      catchError(this.handleError),
    );
  }

  //addCliente(cliente: Cliente): Observable<{ id: string }> {
  addCliente(cliente: Cliente): Observable<{ id: string }> {
    return this.http
      .post<{ id: string }>(`${this.URL}/clientes`, cliente, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  //updateCliente(cliente: Cliente): Observable<Cliente> {
  updateCliente(cliente: Cliente): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.URL}/clientes/${cliente.id}`, cliente, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  //deleteCliente(id: string): Observable<Cliente> {
  deleteCliente(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.URL}/clientes/${id}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
