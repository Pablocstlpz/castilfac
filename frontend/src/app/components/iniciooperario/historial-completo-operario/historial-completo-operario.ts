import { Component, inject, signal } from '@angular/core';
import { Authentication } from '../../../services/authentication';
import { Router } from '@angular/router';
import { ComprobarUsuarioEmpresa } from '../../../services/comprobar-usuario-empresa';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { Usuario } from '../../../interfaces/usuario';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-historial-completo-operario',
  imports: [MatIcon, DatePipe, RouterLink],
  templateUrl: './historial-completo-operario.html',
  styleUrl: './historial-completo-operario.css',
})
export class HistorialCompletoOperario {
  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos
  private router = inject(Router); // Inyectamos el  Router para poder redirigir
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa); // Inyectamos el servicio ComprobarUsuarioEmpresa para poder utilizar sus metodos
  public usuario: Usuario = this.authentication.obtenerUsuarioSesion(); // Inyectamos el servicio Usuario para poder utilizar sus metodos
  private pedidosServices = inject(PedidosServices); // Inyectamos el servicio PedidosServices para poder utilizar sus metodos
  public pedidosArray = signal<Pedido[]>([]); //inyecto el array de pedidos para poder utilizarlos en el html

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo a traves de la funcion para reutilizar que cree
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (usuario === null) {
      this.router.navigate(['/sesioncerrada']);
    }

    //obtengo el historial de pedidos de este operario
    this.obtenerHistorialPedidos();
  }

  //funcion para obtener historial de pedidos de este operario
  obtenerHistorialPedidos(): void {
    this.pedidosServices.getPedidosHistorialByOperario(this.usuario.id).subscribe((pedidos) => {
      this.pedidosArray.set(pedidos);
    });
  }

  //cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
