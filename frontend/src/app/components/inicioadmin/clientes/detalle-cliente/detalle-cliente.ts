import { Component, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ClientesServices } from '../../../../services/clientes';
import { PedidosServices } from '../../../../services/pedidos';
import { Authentication } from '../../../../services/authentication';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detalle-cliente',
  imports: [CommonModule, MatIconModule],
  templateUrl: './detalle-cliente.html',
  styleUrl: './detalle-cliente.css',
})
export class DetalleCliente {
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  //inyectar servicios de clientes
  private clientesService = inject(ClientesServices);

  //inyectar servicios de pedidos
  private pedidosService = inject(PedidosServices);

  //inyectar servicios de autenticacion
  private authentication = inject(Authentication);

  //importar el router para redirigir
  private router = inject(Router);

  // Signal para almacenar el cliente
  public cliente = signal<any>(null);

  // Signal para almacenar los pedidos del cliente
  public pedidosCliente = signal<any[]>([]);

  ngOnInit(): void {
    //compruebo que haya un usuario logueado y que sea admin
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    // obtenemos el id del cliente de la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarCliente(Number(idParam));
      this.cargarPedidosCliente(Number(idParam));
    }
  }

  //funcion para cargar los datos del cliente por su id
  cargarCliente(id: number): void {
    this.clientesService.getCliente(id).subscribe((cliente) => {
      this.cliente.set(cliente);
    });
  }

  //funcion para cargar todos los pedidos de este cliente
  cargarPedidosCliente(id: number): void {
    this.pedidosService.getPedidosByCliente(id).subscribe((pedidos) => {
      this.pedidosCliente.set(pedidos);
    });
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
}
