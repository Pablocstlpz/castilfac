import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Categoria } from '../interfaces/categoria';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class Categorias extends BaseHttpService {
  getCategorias(): Observable<Categoria[]> {
    return this.get<Categoria[]>('/categorias');
  }

  getCategoria(id: number): Observable<Categoria> {
    return this.get<Categoria>(`/categorias/${id}`);
  }
}
