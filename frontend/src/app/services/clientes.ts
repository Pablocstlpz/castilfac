import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Cliente } from '../interfaces/cliente';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class ClientesServices extends BaseHttpService {
  getCliente(id: number): Observable<Cliente> {
    return this.get<Cliente>(`/clientes/id/${id}`);
  }

  getClientePorEmpresa(empresa_id: number): Observable<Cliente[]> {
    return this.get<Cliente[]>(`/clientes/${empresa_id}`);
  }

  addCliente(cliente: Cliente): Observable<{ id: string }> {
    return this.post<{ id: string }>('/clientes', cliente);
  }

  updateCliente(cliente: Cliente): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/clientes/${cliente.id}`, cliente);
  }

  deleteCliente(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/clientes/${id}`);
  }
}
