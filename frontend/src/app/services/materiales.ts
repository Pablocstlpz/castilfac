import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/enviroments';
import { Material } from '../interfaces/material';

@Injectable({
  providedIn: 'root',
})
export class Materiales {
  private URL = environment.apiUrl

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener todos los materiales
  getMateriales(): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.URL}/materiales`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Material
      catchError(this.handleError),
    );
  }

  getMaterial(id: number): Observable<Material> {
    return this.http
      .get<Material>(`${this.URL}/materiales/${id}`)
      .pipe(catchError(this.handleError));
  }

  toggleActivo(id: number): Observable<Material> {
    return this.http
      .patch<Material>(`${this.URL}/materiales/${id}/activo`, {}, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
