import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HistorialPrecioBase } from '../interfaces/historial-precio-base';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class HistorialPreciosBase extends BaseHttpService {
  getHistorialPreciosBase(): Observable<HistorialPrecioBase[]> {
    return this.get<HistorialPrecioBase[]>('/historialPreciosBase');
  }
}
