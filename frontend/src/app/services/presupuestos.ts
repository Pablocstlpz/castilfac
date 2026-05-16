import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Presupuesto } from '../interfaces/presupuesto';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class Presupuestos extends BaseHttpService {
  getPresupuestosEmpresa(empresaId: number): Observable<Presupuesto[]> {
    return this.get<Presupuesto[]>(`/empresas/${empresaId}/presupuestos`);
  }

  getPresupuesto(id: number): Observable<Presupuesto> {
    return this.get<Presupuesto>(`/presupuestos/${id}`);
  }

  addPresupuesto(presupuesto: any): Observable<{ id: number; message: string }> {
    return this.post<{ id: number; message: string }>('/presupuestos', presupuesto);
  }

  updatePresupuesto(id: number, presupuesto: any): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/presupuestos/${id}`, presupuesto);
  }

  patchEstadoPresupuesto(id: number, estado: string): Observable<{ message: string }> {
    return this.patch<{ message: string }>(`/presupuestos/${id}/estado`, { estado });
  }
}
