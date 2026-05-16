import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { PlantillaProducto } from '../interfaces/plantilla-producto';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class PlantillasMateriales extends BaseHttpService {
  getPlantillaMaterialPorPlantillaProducto(
    plantillaId: number,
  ): Observable<PlantillaProducto[]> {
    return this.get<PlantillaProducto[]>(`/plantillas-materiales/${plantillaId}`);
  }
}
