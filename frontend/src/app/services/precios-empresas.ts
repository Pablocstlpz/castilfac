import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PrecioEmpresa } from '../interfaces/precio-empresa';

@Injectable({
  providedIn: 'root',
})
export class PreciosEmpresas {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener precios de una empresa
  getPreciosEmpresa(id: number): Observable<PrecioEmpresa[]> {
    return this.http.get<PrecioEmpresa[]>(`${this.URL}/precios/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de PrecioEmpresa
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
