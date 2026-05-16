import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PrecioEmpresa } from '../interfaces/precio-empresa';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class PreciosEmpresas extends BaseHttpService {
  getPreciosEmpresa(id: number): Observable<PrecioEmpresa[]> {
    return this.get<PrecioEmpresa[]>(`/precios/${id}`);
  }
}
