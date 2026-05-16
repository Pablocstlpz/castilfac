import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class StripeServices extends BaseHttpService {
  crearSesionCheckout(empresa_id: number): Observable<{ url: string }> {
    return this.post<{ url: string }>('/stripe/crear-sesion', { empresa_id });
  }

  verificarSesionPago(session_id: string): Observable<{ message: string }> {
    return this.post<{ message: string }>('/stripe/verificar-sesion', { session_id });
  }
}
