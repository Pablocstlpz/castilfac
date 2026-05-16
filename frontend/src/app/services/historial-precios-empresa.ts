import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HistorialPrecioEmpresa } from '../interfaces/historial-precio-empresa';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class HistorialPreciosEmpresa extends BaseHttpService {
  getHistorialPreciosEmpresa(): Observable<HistorialPrecioEmpresa[]> {
    return this.get<HistorialPrecioEmpresa[]>('/historialPreciosEmpresa');
  }
}
