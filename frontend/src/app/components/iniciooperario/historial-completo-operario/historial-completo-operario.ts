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

@Component({
  selector: 'app-historial-completo-operario',
  imports: [MatIcon, DatePipe, RouterLink, TranslatePipe],
  templateUrl: './historial-completo-operario.html',
  styleUrl: './historial-completo-operario.css',
})
export class HistorialCompletoOperario {
  private authentication = inject(Authentication);
  private router = inject(Router);
  //usuario operario en sesion, lo uso para pedir su historial al backend
  public usuario: Usuario = this.authentication.obtenerUsuarioSesion()!;
  private pedidosServices = inject(PedidosServices);
  //signal con el historial completo de pedidos de este operario
  public pedidosArray = signal<Pedido[]>([]);

  ngOnInit(): void {
    this.obtenerHistorialPedidos();
  }

  //funcion para obtener el historial completo de pedidos de este operario
  obtenerHistorialPedidos(): void {
    this.pedidosServices.getPedidosHistorialByOperario(this.usuario.id).subscribe((pedidos) => {
      this.pedidosArray.set(pedidos);
    });
  }

  //funcion para cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
