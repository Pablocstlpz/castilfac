import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';
import { ElementoMaterial } from '../interfaces/elemento-material';

@Injectable({
  providedIn: 'root',
})
export class ElementosMateriales {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener todos los elementos
  getElementosMateriales(): Observable<ElementoMaterial[]> {
    return this.http.get<ElementoMaterial[]>(`${this.URL}/elementosMateriales`).pipe(
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
