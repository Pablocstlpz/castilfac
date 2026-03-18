import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Authentication } from '../../services/authentication';
import { Router } from '@angular/router';
import { ComprobarUsuarioEmpresa } from '../../services/comprobar-usuario-empresa';
import { Usuario } from '../../interfaces/usuario';
import { UpperCasePipe } from '@angular/common';
import { PedidosServices } from '../../services/pedidos';
import { Pedido } from '../../interfaces/pedido';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-iniciooperario',
  imports: [CommonModule, MatIconModule, UpperCasePipe],
  templateUrl: './iniciooperario.html',
  styleUrl: './iniciooperario.css',
})
export class Iniciooperario {

  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos
  private router = inject(Router); // Inyectamos el  Router para poder redirigir
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa); // Inyectamos el servicio ComprobarUsuarioEmpresa para poder utilizar sus metodos
  public usuario: Usuario = this.authentication.obtenerUsuarioSesion(); // Inyectamos el servicio Usuario para poder utilizar sus metodos
  private pedidosServices = inject(PedidosServices); // Inyectamos el servicio PedidosServices para poder utilizar sus metodos
  public pedidosArray = signal<Pedido[]>([]) //inyecto el array de pedidos para poder utilizarlos en el html

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo a traves de la funcion para reutilizar que cree
    this.comprobarUsuarioEmpresa.comprobarUsuarioEmpresa();
    //obtengo los pedidos de este operario que esten en fabricacion
    this.obtenerPedidosEnFabricacion();
  }

  //cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //obtener todos los pedidos de este operario que esten en fabricacion
  obtenerPedidosEnFabricacion() {
    this.pedidosServices.getPedidosByOperario(this.usuario.id).subscribe((pedidos) => {
      this.pedidosArray.set(pedidos);
    });
  }
}
