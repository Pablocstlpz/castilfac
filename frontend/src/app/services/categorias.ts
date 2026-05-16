import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Categoria } from '../interfaces/categoria';

@Injectable({
  providedIn: 'root',
})
export class Categorias {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  //obtener todas las categorias
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.URL}/categorias`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un array de Categoria
      catchError(this.handleError),
    );
  }

  //obtener una categoria por id
  getCategoria(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.URL}/categorias/${id}`).pipe(
      map((response) => response), // Aseguramos que la respuesta se trate como un objeto Categoria
      catchError(this.handleError),
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
