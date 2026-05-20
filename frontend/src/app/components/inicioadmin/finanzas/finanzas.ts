import { Component, inject, signal, computed } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-finanzas',
  imports: [MatIcon, CommonModule, FormsModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.css',
})
export class Finanzas {
  private authentication = inject(Authentication);
  private pedidosServices = inject(PedidosServices);
  private router = inject(Router);

  //filtro temporal que aplica el usuario (mes, año o global)
  public filtroTiempo = signal<'mes' | 'anio' | 'global'>('global');
  //lista de pedidos que se muestran segun el filtro
  public listaPedidos = signal<Pedido[]>([]);
  //texto que ha escrito el usuario en la busqueda de deudores
  public busqueda = signal<string>('');
  public cargando = signal<boolean>(true);

  //ingresos totales que tendria que cobrar la empresa segun lo acordado en cada pedido
  public ingresosPactados = computed(() =>
    this.listaPedidos().reduce((acc, p) => acc + Number(p.importe_acordado), 0),
  );

  //ingresos reales que ha cobrado la empresa
  public ingresosReales = computed(() =>
    this.listaPedidos().reduce((acc, p) => acc + Number(p.importe_pagado), 0),
  );

  //deuda total = lo que falta por cobrar
  public deudaTotal = computed(() => this.ingresosPactados() - this.ingresosReales());

  //listado de pedidos con deuda, filtrado por busqueda para mostrar en la tabla
  public deudoresFiltrados = computed(() => {
    return this.listaPedidos().filter((p) => {
      //solo me quedo con los pedidos que tienen deuda pendiente
      const tieneDeuda = Number(p.importe_pagado) < Number(p.importe_acordado);
      //ademas filtro por nombre de cliente o numero de pedido si hay busqueda
      const coincideBusqueda =
        !this.busqueda() ||
        p.cliente_nombre.toLowerCase().includes(this.busqueda().toLowerCase()) ||
        p.numero_pedido.toLowerCase().includes(this.busqueda().toLowerCase());
      return tieneDeuda && coincideBusqueda;
    });
  });

  ngOnInit(): void {
    //al cargar la pagina traigo los datos financieros del usuario para su empresa
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(["/sesioncerrada"]); return; }
    this.cargarDatos(usuario.empresa_id, this.filtroTiempo());
  }

  //funcion para cambiar el filtro de tiempo y recargar los datos con el nuevo rango
  cambiarFiltro(rango: 'mes' | 'anio' | 'global'): void {
    this.filtroTiempo.set(rango);
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario !== null) {
      this.cargarDatos(usuario.empresa_id, rango);
    }
  }

  //funcion para cargar los pedidos de finanzas filtrados por rango temporal
  cargarDatos(empresa_id: number, rango: 'mes' | 'anio' | 'global'): void {
    this.pedidosServices.getFinanzasPorEmpresa(empresa_id, rango).subscribe({
      next: (pedidos) => {
        this.listaPedidos.set(pedidos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  //funcion para abrir el detalle de un pedido y poder registrar un cobro desde alli
  abrirModalCobro(pedido: Pedido): void {
    this.router.navigate(['/inicioadmin/pedidos/pedido-detallado', pedido.id]);
  }
}
