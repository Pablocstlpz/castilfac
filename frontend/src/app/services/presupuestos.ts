import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Presupuesto } from '../interfaces/presupuesto';

@Injectable({
  providedIn: 'root',
})
export class Presupuestos {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener presupuestos de una empresa
  getPresupuestosEmpresa(empresaId: number): Observable<Presupuesto[]> {
    return this.http.get<Presupuesto[]>(`${this.URL}/empresas/${empresaId}/presupuestos`).pipe(
      map((response) => response),
      catchError(this.handleError),
    );
  }

  //obtener un presupuesto por su id
  getPresupuesto(id: number): Observable<Presupuesto> {
    return this.http
      .get<Presupuesto>(`${this.URL}/presupuestos/${id}`)
      .pipe(catchError(this.handleError));
  }

  // AÑADIR ESTO EN TU ARCHIVO services/presupuestos.ts

  addPresupuesto(presupuesto: any): Observable<{ id: number; message: string }> {
    return this.http
      .post<{
        id: number;
        message: string;
      }>(`${this.URL}/presupuestos`, presupuesto, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePresupuesto(id: number, presupuesto: any): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.URL}/presupuestos/${id}`, presupuesto, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  patchEstadoPresupuesto(id: number, estado: string): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.URL}/presupuestos/${id}/estado`, { estado }, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
