import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UpperCasePipe } from '@angular/common';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { Authentication } from '../../../services/authentication';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-pedidos',
  imports: [MatIcon, RouterLink, DatePipe, UpperCasePipe, NgClass],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  //inyecto el servicio de pedidos
  private pedidosServices = inject(PedidosServices);

  //inyecto el servicio de autenticacion
  private authentication = inject(Authentication);

  //inyecto el router para poder redirigir
  private router = inject(Router);

  //hago signal de pedidos que tendra un array de pedidos y se inicializara vacia
  public pedidos = signal<Pedido[]>([]);

  //hago signal de filtroActual que tendra un string y se inicializara en 'todos'
  public filtroActual = signal<string>('todos');

  //al cargar la pagina
  ngOnInit(): void {
    //obtengo el usuario de la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //si el usuario es null o no es admin ni operario
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    //obtengo los pedidos de la empresa y los asigno al signal de pedidos
    this.obtenerPedidos(usuario.empresa_id);
  }

  //funcion para obtener los pedidos de la empresa
  obtenerPedidos(empresa_id: number): void {
    this.pedidosServices.getPedidosByEmpresa(empresa_id).subscribe((pedidos) => {
      console.log(pedidos);
      this.pedidos.set(pedidos);
    });
  }

  //funcion para calcular porcentaje de pago
  calcularPorcentajePago(acordado: number, pagado: number): number {
    if (!acordado || acordado === 0) return 0;
    return Math.round((pagado / acordado) * 100);
  }
}
