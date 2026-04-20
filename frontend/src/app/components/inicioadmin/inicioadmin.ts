import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ComprobarUsuarioEmpresa } from '../../services/comprobar-usuario-empresa';
import { Authentication } from '../../services/authentication';
import { UsuariosServices } from '../../services/usuarios';
import { PedidosServices } from '../../services/pedidos';

@Component({
  selector: 'app-inicioadmin',
  imports: [MatIconModule, CommonModule, RouterLink],
  templateUrl: './inicioadmin.html',
  styleUrl: './inicioadmin.css',
})
export class Inicioadmin {
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa);
  private authentication = inject(Authentication);
  private router = inject(Router);

  //inyecto los servicios de usuarios
  private usuariosServices = inject(UsuariosServices);

  //inyecto los servicios de pedidos
  private pedidosServices = inject(PedidosServices);

  //signal con numero de usuarios en la empresa
  public numeroUsuarios = signal<number>(0);

  //signal con numero de pedidos activos en la empresa
  public numeroPedidos = signal<number>(0);

  ngOnInit() {
    this.comprobarUsuarioEmpresa.comprobarUsuarioEmpresa();
    //compruebo si hay usuario en la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //si no hay usuario o no es admin
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    //obtengo los usuarios de la empresa y los asigno al signal de numeroUsuarios
    this.obtenerUsuarios(usuario.empresa_id);

    //obtengo los pedidos en fabricacion de la empresa y los asigno al signal de numeroPedidos
    this.obtenerTrabajos(usuario.empresa_id);
  }

  //funcion para cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  //funcion para obtener usuarios de la empresa
  obtenerUsuarios(empresa_id: number) {
    this.usuariosServices.getUsuarioPorEmpresa(empresa_id).subscribe((usuarios) => {
      this.numeroUsuarios.set(usuarios.length);
    });
  }

  //funcion para obtener trabajos activos (en cola o fabricacion)
  obtenerTrabajos(empresa_id: number) {
    this.pedidosServices.getPedidosByEmpresa(empresa_id).subscribe((pedidos) => {
      //filtro en una array los pedidos que esten en fabricacion
      const pedidosEnFabricacion = pedidos.filter(
        (pedido) => pedido.estado_fabricacion === 'en_fabricacion',
      );
      //los inserto en el signal
      this.numeroPedidos.set(pedidosEnFabricacion.length);
    });
  }
}
