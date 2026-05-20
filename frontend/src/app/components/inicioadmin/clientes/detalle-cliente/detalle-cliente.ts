import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ClientesServices } from '../../../../services/clientes';
import { PedidosServices } from '../../../../services/pedidos';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-detalle-cliente',
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './detalle-cliente.html',
  styleUrl: './detalle-cliente.css',
})
export class DetalleCliente {
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  private clientesService = inject(ClientesServices);
  private pedidosService = inject(PedidosServices);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Signal para almacenar el cliente
  public cliente = signal<any>(null);

  // Signal para almacenar los pedidos del cliente
  public pedidosCliente = signal<any[]>([]);
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      forkJoin({
        cliente: this.clientesService.getCliente(Number(idParam)),
        pedidos: this.pedidosService.getPedidosByCliente(Number(idParam)),
      }).subscribe({
        next: ({ cliente, pedidos }) => {
          this.cliente.set(cliente);
          this.pedidosCliente.set(pedidos);
          this.cargando.set(false);
        },
        error: () => { this.cargando.set(false); },
      });
    }
  }

  //funcion para calcular el saldo pendiente sumando lo que queda por pagar en cada pedido
  getSaldoPendiente(): number {
    return this.pedidosCliente().reduce(
      (acc, p) => acc + (p.importe_acordado - p.importe_pagado),
      0,
    );
  }

  //funcion para obtener la fecha del pedido mas reciente
  getUltimaCompra(): Date | null {
    if (this.pedidosCliente().length === 0) return null;
    const fechas = this.pedidosCliente().map((p) => new Date(p.fecha_pedido));
    return new Date(Math.max(...fechas.map((f) => f.getTime())));
  }

  //funcion para ir al formulario de edicion pasando el id por queryParam
  editarCliente(): void {
    this.router.navigate(['/inicioadmin/clientes/formulario-cliente'], {
      queryParams: { id: this.cliente().id },
    });
  }

  //funcion para volver atras
  volver(): void {
    this.location.back();
  }

  //funcion para obtener el color del badge segun el tipo de cliente
  getTipoColor(tipo: string): string {
    const colores: Record<string, string> = {
      particular: 'bg-blue-100 text-blue-700 border border-blue-200',
      empresa: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      vip: 'bg-amber-100 text-amber-700 border border-amber-200',
      mayorista: 'bg-purple-100 text-purple-700 border border-purple-200',
    };
    return colores[tipo] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  //funcion para obtener el color del badge segun el estado del pedido
  getEstadoColor(estado: string): string {
    const colores: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      en_fabricacion: 'bg-blue-100 text-blue-700 border border-blue-200',
      fabricado: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      entregado: 'bg-teal-100 text-teal-700 border border-teal-200',
      instalado: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
      finalizado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      cancelado: 'bg-red-100 text-red-700 border border-red-200',
    };
    return colores[estado] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  etiquetaTipoCliente(tipo: string): string {
    const keys: Record<string, string> = {
      particular: 'clients.typeParticular',
      empresa: 'clients.typeCompany',
      vip: 'clients.typeVip',
      mayorista: 'clients.typeWholesaler',
    };
    const key = keys[tipo];
    return key ? this.translate.instant(key) : tipo;
  }

  etiquetaEstadoPedido(estado: string): string {
    const keys: Record<string, string> = {
      pendiente: 'orders.statusPending',
      en_fabricacion: 'orders.statusInProduction',
      fabricado: 'orders.statusManufactured',
      entregado: 'orders.statusDelivered',
      instalado: 'orders.statusInstalled',
      finalizado: 'orders.statusCompleted',
      cancelado: 'orders.statusCancelled',
    };
    const key = keys[estado];
    return key ? this.translate.instant(key) : estado;
  }
}
