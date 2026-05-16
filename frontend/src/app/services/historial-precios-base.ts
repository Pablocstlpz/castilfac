import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HistorialPrecioBase } from '../interfaces/historial-precio-base';

@Injectable({
  providedIn: 'root',
})
export class HistorialPreciosBase {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener todos los elementos
  getHistorialPreciosBase(): Observable<HistorialPrecioBase[]> {
    return this.http.get<HistorialPrecioBase[]>(`${this.URL}/historialPreciosBase`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de HistorialPrecioBase
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
