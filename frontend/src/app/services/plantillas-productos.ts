import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PlantillaProducto } from '../interfaces/plantilla-producto';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class PlantillasProductos extends BaseHttpService {
  getPlantillasProductos(): Observable<PlantillaProducto[]> {
    return this.get<PlantillaProducto[]>('/plantillas-producto');
  }

  getPlantillasProductosEmpresa(empresaId: number): Observable<PlantillaProducto[]> {
    return this.get<PlantillaProducto[]>(`/plantillas-producto/empresa/${empresaId}`);
  }
}
