import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';
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

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
