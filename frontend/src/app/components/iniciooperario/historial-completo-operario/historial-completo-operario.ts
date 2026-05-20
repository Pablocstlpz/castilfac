import { Component, inject, signal } from '@angular/core';
import { Authentication } from '../../../services/authentication';
import { Router } from '@angular/router';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { Usuario } from '../../../interfaces/usuario';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-historial-completo-operario',
  imports: [MatIcon, DatePipe, RouterLink, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './historial-completo-operario.html',
  styleUrl: './historial-completo-operario.css',
})
export class HistorialCompletoOperario {
  private authentication = inject(Authentication);
  private router = inject(Router);
  //usuario operario en sesion, lo cargo en ngOnInit con null-check para que no rompa si se borra la sesion en otra pestaña
  public usuario!: Usuario;
  private pedidosServices = inject(PedidosServices);
  //signal con el historial completo de pedidos de este operario
  public pedidosArray = signal<Pedido[]>([]);
  public cargando = signal<boolean>(true);

  ngOnInit(): void {
    //compruebo que hay sesion antes de usar el usuario, si no rebote a /sesioncerrada
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(['/sesioncerrada']); return; }
    this.usuario = usuario;
    this.obtenerHistorialPedidos();
  }

  //funcion para obtener el historial completo de pedidos de este operario
  obtenerHistorialPedidos(): void {
    this.cargando.set(true);
    this.pedidosServices.getPedidosHistorialByOperario(this.usuario.id).subscribe({
      next: (pedidos) => {
        this.pedidosArray.set(pedidos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  //funcion para cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
