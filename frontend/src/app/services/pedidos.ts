import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Pedido } from '../interfaces/pedido';
import { BaseHttpService } from './base-http.service';

@Injectable({ providedIn: 'root' })
export class PedidosServices extends BaseHttpService {
  getPedidos(): Observable<Pedido[]> {
    return this.get<Pedido[]>('/pedidos');
  }

  getPedido(id: number): Observable<Pedido> {
    return this.get<Pedido>(`/pedidos/${id}`);
  }

  getPedidosByEmpresa(id: number): Observable<Pedido[]> {
    return this.get<Pedido[]>(`/pedidos/empresa/${id}`);
  }

  getPedidosByCliente(id: number): Observable<Pedido[]> {
    return this.get<Pedido[]>(`/pedidos/cliente/${id}`);
  }

  getPedidosByOperario(id: number): Observable<Pedido[]> {
    return this.get<Pedido[]>(`/pedidos/operario/${id}`);
  }

  existePedidoDePresupuesto(presupuestoId: number): Observable<{ existe: boolean }> {
    return this.get<{ existe: boolean }>(`/pedidos/presupuesto/${presupuestoId}`);
  }

  createPedido(pedido: any): Observable<{ id: number; message: string }> {
    return this.post<{ id: number; message: string }>('/pedidos', pedido);
  }

  updatePedido(pedido: Pedido): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/pedidos/${pedido.id}`, pedido);
  }

  deletePedido(id: number): Observable<{ message: string }> {
    return this.delete<{ message: string }>(`/pedidos/${id}`);
  }

  marcarComoFabricado(id: number): Observable<{ message: string }> {
    return this.put<{ message: string }>(`/pedidos/marcar-fabricado/${id}`, {});
  }

  getFinanzasPorEmpresa(
    id: number,
    rango: 'mes' | 'anio' | 'global',
  ): Observable<Pedido[]> {
    return this.get<Pedido[]>(`/pedidos/finanzas/empresa/${id}?rango=${rango}`);
  }

  getPedidosHistorialByOperario(id: number): Observable<Pedido[]> {
    return this.get<Pedido[]>(`/pedidos/historial/operario/${id}`);
  }
}
