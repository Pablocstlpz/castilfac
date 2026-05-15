import { Component, inject, signal, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';

@Component({
  selector: 'app-finanzas',
  imports: [MatIcon, CommonModule, FormsModule],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  private authentication = inject(Authentication);
  private pedidosServices = inject(PedidosServices);
  private router = inject(Router);

  public filtroTiempo = signal<'mes' | 'anio' | 'global'>('global');
  public listaPedidos = signal<Pedido[]>([]);
  public busqueda = signal<string>('');

  public ingresosPactados = computed(() =>
    this.listaPedidos().reduce((acc, p) => acc + Number(p.importe_acordado), 0),
  );

  public ingresosReales = computed(() =>
    this.listaPedidos().reduce((acc, p) => acc + Number(p.importe_pagado), 0),
  );

  public deudaTotal = computed(() => this.ingresosPactados() - this.ingresosReales());

  public deudoresFiltrados = computed(() => {
    return this.listaPedidos().filter((p) => {
      const tieneDeuda = Number(p.importe_pagado) < Number(p.importe_acordado);
      const coincideBusqueda =
        !this.busqueda() ||
        p.cliente_nombre.toLowerCase().includes(this.busqueda().toLowerCase()) ||
        p.numero_pedido.toLowerCase().includes(this.busqueda().toLowerCase());
      return tieneDeuda && coincideBusqueda;
    });
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;
    this.cargarDatos(usuario.empresa_id, this.filtroTiempo());
  }

  cambiarFiltro(rango: 'mes' | 'anio' | 'global'): void {
    this.filtroTiempo.set(rango);
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario !== null) {
      this.cargarDatos(usuario.empresa_id, rango);
    }
  }

  cargarDatos(empresa_id: number, rango: 'mes' | 'anio' | 'global'): void {
    this.pedidosServices.getFinanzasPorEmpresa(empresa_id, rango).subscribe((pedidos) => {
      this.listaPedidos.set(pedidos);
    });
  }

  abrirModalCobro(pedido: Pedido): void {
    this.router.navigate(['/inicioadmin/pedidos/pedido-detallado', pedido.id]);
  }
}
