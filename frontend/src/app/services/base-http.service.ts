import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

/**
 * BaseHttpService.
 *
 * Centraliza tres cosas que estaban duplicadas en cada uno de los ~15 servicios:
 *   1. La URL base (`environment.apiUrl`).
 *   2. El handleError que mapea HttpErrorResponse a Error con el `message`
 *      legible del backend.
 *   3. Los verbos http (get/post/put/patch/delete) con tipado generico.
 *
 * El Authorization: Bearer se lo inyecta el authInterceptor (Bloque 1), por lo
 * que no necesitamos seguir pasando httpOptions con headers manuales.
 *
 * Como migrar un servicio existente:
 *   1. `extends BaseHttpService`.
 *   2. Borra el `private URL = environment.apiUrl;` y los `httpOptions`.
 *   3. Sustituye `this.http.get<X>(`${this.URL}/foo`)` por `this.get<X>('/foo')`.
 *   4. Borra el `handleError` privado del servicio.
 */
@Injectable({ providedIn: 'root' })
export class BaseHttpService {
  // protected para que las clases hijas puedan leerlo si lo necesitan
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;

  protected get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.baseUrl + path).pipe(catchError(this.handleError));
  }

  protected post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.baseUrl + path, body).pipe(catchError(this.handleError));
  }

  protected put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.baseUrl + path, body).pipe(catchError(this.handleError));
  }

  protected patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.baseUrl + path, body).pipe(catchError(this.handleError));
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.baseUrl + path).pipe(catchError(this.handleError));
  }

  // arrow para que `this` no se pierda al pasarlo a catchError
  protected handleError = (error: HttpErrorResponse) => {
    // El interceptor ya maneja 401/403 (sesion expirada / sin permisos / sin suscripcion).
    // Aqui solo traducimos a un Error con `message` legible que los componentes pintan.
    const errorMessage =
      error.error?.message || 'Error desconocido al procesar la solicitud';
    return throwError(() => new Error(errorMessage));
  };
}
