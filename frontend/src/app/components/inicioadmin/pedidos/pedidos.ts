import { Component, inject, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { UpperCasePipe } from '@angular/common';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { Authentication } from '../../../services/authentication';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosServices } from '../../../services/usuarios';
import { Usuario } from '../../../interfaces/usuario';
import { ClientesServices } from '../../../services/clientes';
import { Cliente } from '../../../interfaces/cliente';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-pedidos',
  imports: [MatIcon, DatePipe, UpperCasePipe, NgClass, RouterLink, FormsModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  private pedidosServices = inject(PedidosServices);
  private authentication = inject(Authentication);
  private usuariosServices = inject(UsuariosServices);
  private clientesServices = inject(ClientesServices);
  private translate = inject(TranslateService);
  private router = inject(Router);

  private todosPedidos = signal<Pedido[]>([]);
  public usuarios = signal<Usuario[]>([]);
  public clientes = signal<Cliente[]>([]);

  public busqueda = signal<string>('');
  public filtroEstado = signal<string>('todos');
  public cargando = signal<boolean>(true);

  public pedidos = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const estado = this.filtroEstado();
    return this.todosPedidos().filter((p) => {
      const coincideEstado = estado === 'todos' || p.estado_fabricacion === estado;
      const coincideBusqueda =
        !q ||
        p.numero_pedido.toLowerCase().includes(q) ||
        this.getNombreCliente(p.cliente_id).toLowerCase().includes(q);
      return coincideEstado && coincideBusqueda;
    });
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(["/sesioncerrada"]); return; }
    forkJoin({
      pedidos: this.pedidosServices.getPedidosByEmpresa(usuario.empresa_id),
      usuarios: this.usuariosServices.getUsuarioPorEmpresa(usuario.empresa_id),
      clientes: this.clientesServices.getClientePorEmpresa(usuario.empresa_id),
    }).subscribe({
      next: ({ pedidos, usuarios, clientes }) => {
        this.todosPedidos.set(pedidos);
        this.usuarios.set(usuarios);
        this.clientes.set(clientes);
        this.cargando.set(false);
      },
      error: () => { this.cargando.set(false); },
    });
  }

  //funcion para calcular porcentaje de pago
  calcularPorcentajePago(acordado: number, pagado: number): number {
    if (!acordado || acordado === 0) return 0;
    return Math.round((pagado / acordado) * 100);
  }

  // Funcion para transformar el ID en Nombre buscando en el Signal de usuarios
  getNombreOperario(id: any): string {
    if (!id) return this.translate.instant('orders.unassigned');

    const operario = this.usuarios().find((u) => u.id == id);

    return operario ? operario.nombre : this.translate.instant('orders.loading');
  }

  // Funcion para transformar el ID en Nombre buscando en el Signal de clientes
  getNombreCliente(id: any): string {
    if (!id) return this.translate.instant('orders.unassigned');

    const cliente = this.clientes().find((c) => c.id == id);

    return cliente ? cliente.nombre_empresa_o_particular : this.translate.instant('orders.loading');
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
}
