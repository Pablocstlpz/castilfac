import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Elemento } from '../interfaces/elemento';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class Elementos extends BaseHttpService {
  getElementos(): Observable<Elemento[]> {
    return this.get<Elemento[]>('/elementos');
  }
}
