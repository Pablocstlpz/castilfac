import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { catchError, Observable, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StripeServices {
  private URL = environment.apiUrl;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      //  'Authorization': `Bearer ${this.token}`
    }),
  };

  private http = inject(HttpClient);

  crearSesionCheckout(empresa_id: number): Observable<{ url: string }> {
    return this.http
      .post<{ url: string }>(`${this.URL}/stripe/crear-sesion`, { empresa_id }, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  verificarSesionPago(session_id: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.URL}/stripe/verificar-sesion`,
        { session_id },
        this.httpOptions,
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.log(error);

    const errorMessage = error.error?.message || 'Error desconocido al procesar la solicitud';

    return throwError(() => new Error(errorMessage));
  }
}
