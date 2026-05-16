import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Elemento } from '../interfaces/elemento';

@Injectable({
  providedIn: 'root',
})
export class Elementos {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener todos los elementos
  getElementos(): Observable<Elemento[]> {
    return this.http.get<Elemento[]>(`${this.URL}/elementos`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Elemento
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
