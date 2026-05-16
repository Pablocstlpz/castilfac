import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ElementoMaterial } from '../interfaces/elemento-material';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class ElementosMateriales extends BaseHttpService {
  getElementosMateriales(): Observable<ElementoMaterial[]> {
    return this.get<ElementoMaterial[]>('/elementosMateriales');
  }
}
