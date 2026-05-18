import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

import { PedidosServices } from '../../../../services/pedidos';
import { UsuariosServices } from '../../../../services/usuarios';
import { Authentication } from '../../../../services/authentication';
import { Presupuestos } from '../../../../services/presupuestos';

import { Pedido } from '../../../../interfaces/pedido';
import { Usuario } from '../../../../interfaces/usuario';
import { Presupuesto } from '../../../../interfaces/presupuesto';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-detalle-pedido',
  imports: [CommonModule, MatIconModule, FormsModule, TranslatePipe],
  templateUrl: './detalle-pedido.html',
  styleUrl: './detalle-pedido.css',
})
export class DetallePedido implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private router = inject(Router);
  private pedidosService = inject(PedidosServices);
  private usuariosService = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private presupuestosService = inject(Presupuestos);
  private translate = inject(TranslateService);

  //signals principales
  public pedido = signal<Pedido | null>(null);
  public usuarios = signal<Usuario[]>([]);
  public presupuesto = signal<Presupuesto | null>(null);

  //variables para los inputs
  public nuevoPago: number = 0;
  public notasPedido: string = '';
  public fechaEntregaReal: string = '';
  public fechaInstalacion: string = '';

  //signals para feedback visual
  public mensajeExito = signal<string | null>(null);
  public mensajeError = signal<string | null>(null);

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cargarDatosPedido(Number(idParam));
    }

    this.cargarUsuariosEmpresa(usuario.empresa_id);
  }

  cargarDatosPedido(id: number): void {
    this.pedidosService.getPedido(id).subscribe({
      next: (data) => {
        this.pedido.set(data);
        //sincronizo los inputs con los datos que vengan del pedido
        this.notasPedido = data.notas_operario || '';
        this.fechaEntregaReal = this.formatearFecha(data.fecha_entrega_real);
        this.fechaInstalacion = this.formatearFecha(data.fecha_instalacion);
        //cargo el presupuesto vinculado al pedido
        if (data.presupuesto_id) {
          this.cargarPresupuesto(data.presupuesto_id);
        }
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.loadError'));
      },
    });
  }

  cargarPresupuesto(id: number): void {
    this.presupuestosService.getPresupuesto(id).subscribe({
      next: (data) => {
        this.presupuesto.set(data);
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.loadError'));
      },
    });
  }

  cargarUsuariosEmpresa(empresaId: number): void {
    this.usuariosService.getUsuarioPorEmpresa(empresaId).subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.loadError'));
      },
    });
  }

  volverAtras(): void {
    this.location.back();
  }

  verPresupuesto(id: number): void {
    this.router.navigate(['/inicioadmin/presupuestos/detalle-presupuesto', id]);
  }

  cambiarEstado(nuevoEstado: string): void {
    const p = this.pedido();
    if (!p) return;

    //actualizo el signal localmente para que la UI responda al instante
    const pedidoActualizado = { ...p, estado_fabricacion: nuevoEstado as Pedido['estado_fabricacion'] };
    this.pedido.set(pedidoActualizado);

    //persisto el cambio en la base de datos
    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.statusUpdated'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  asignarOperario(event: any): void {
    const p = this.pedido();
    if (!p) return;

    //si el valor es "null" (string) lo convierto a null real, si no a número
    const nuevoId = event.target.value === 'null' ? null : Number(event.target.value);
    const pedidoActualizado = { ...p, operario_asignado_id: nuevoId };
    this.pedido.set(pedidoActualizado);

    //guardo en la base de datos
    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.operatorAssigned'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  registrarPago(): void {
    const p = this.pedido();
    if (!p || this.nuevoPago <= 0) return;

    //casteo a número por si la API devuelve los importes como string
    const pagado = Number(p.importe_pagado);
    const acordado = Number(p.importe_acordado);
    const totalPagado = pagado + this.nuevoPago;

    //valido que no se supere el importe acordado
    if (totalPagado > acordado) {
      this.mostrarError(this.translate.instant('orders.paymentExceeds'));
      return;
    }

    const pedidoActualizado = { ...p, importe_pagado: totalPagado, importe_acordado: acordado };
    this.pedido.set(pedidoActualizado);
    this.nuevoPago = 0;

    //guardo el cobro en la base de datos
    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.paymentRegistered'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  registrarCobroTotal(): void {
    const p = this.pedido();
    if (!p || this.yaLiquidado()) return;

    const acordado = Number(p.importe_acordado);
    const pedidoActualizado = { ...p, importe_pagado: acordado, importe_acordado: acordado };
    this.pedido.set(pedidoActualizado);

    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.orderSettled'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  yaLiquidado(): boolean {
    const p = this.pedido();
    if (!p) return true;
    return Number(p.importe_pagado) >= Number(p.importe_acordado);
  }

  guardarNotas(): void {
    const p = this.pedido();
    if (!p) return;

    //actualizo el signal con las notas del textarea
    const pedidoActualizado = { ...p, notas_operario: this.notasPedido };
    this.pedido.set(pedidoActualizado);

    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.notesSaved'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  guardarFechas(): void {
    const p = this.pedido();
    if (!p) return;

    const pedidoActualizado: Pedido = {
      ...p,
      fecha_entrega_real: this.fechaEntregaReal ? new Date(this.fechaEntregaReal) : null,
      fecha_instalacion: this.fechaInstalacion ? new Date(this.fechaInstalacion) : null,
    };
    this.pedido.set(pedidoActualizado);

    this.pedidosService.updatePedido(pedidoActualizado).subscribe({
      next: () => {
        this.mostrarExito(this.translate.instant('orders.datesUpdated'));
      },
      error: () => {
        this.mostrarError(this.translate.instant('orders.saveError'));
      },
    });
  }

  //convierte una fecha a string formato yyyy-MM-dd para el input type="date"
  private formatearFecha(fecha: Date | string | null): string {
    if (!fecha) return '';
    return new Date(fecha).toISOString().split('T')[0];
  }

  getNombreOperario(id: number | null): string {
    if (!id) return this.translate.instant('orders.unassigned');
    const operario = this.usuarios().find((u) => u.id === id);
    return operario ? operario.nombre : this.translate.instant('orders.unassigned');
  }

  etiquetaEstadoFabricacion(estado: string): string {
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

  calcularPorcentajePago(): number {
    const p = this.pedido();
    if (!p) return 0;
    const acordado = Number(p.importe_acordado);
    if (acordado === 0) return 0;
    return Math.min(Math.round((Number(p.importe_pagado) / acordado) * 100), 100);
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    setTimeout(() => this.mensajeExito.set(null), 2500);
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError.set(mensaje);
    setTimeout(() => this.mensajeError.set(null), 3500);
  }
}
