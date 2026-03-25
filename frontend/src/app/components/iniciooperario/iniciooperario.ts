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
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-iniciooperario',
  imports: [CommonModule, MatIconModule, UpperCasePipe, RouterLink],
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
  private snackBar = inject(MatSnackBar); //inyecto el servicio MatSnackBar para poder utilizar sus metodos

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

    //marcar como fabricado cuando se da click al boton
    marcarFabricado(id: number): void {
      try {
        this.pedidosServices.marcarComoFabricado(id).subscribe({
          next: () => {
            this.obtenerPedidosEnFabricacion();
            this.snackBar.open('Pedido marcado como fabricado', 'Cerrar', {
              duration: 3000,
              panelClass: 'snackbar-success',
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open(err?.message ?? 'No se pudo marcar el pedido', 'Cerrar', {
              duration: 4000,
              panelClass: 'snackbar-error',
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
        });
      } catch (error) {
        console.log(error);
      }
    }
  }