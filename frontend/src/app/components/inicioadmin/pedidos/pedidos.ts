import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { UpperCasePipe } from '@angular/common';
import { PedidosServices } from '../../../services/pedidos';
import { Pedido } from '../../../interfaces/pedido';
import { Authentication } from '../../../services/authentication';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { UsuariosServices } from '../../../services/usuarios';
import { Usuario } from '../../../interfaces/usuario';
import { ClientesServices } from '../../../services/clientes';
import { Cliente } from '../../../interfaces/cliente';

@Component({
  selector: 'app-pedidos',
  imports: [MatIcon, DatePipe, UpperCasePipe, NgClass, RouterLink],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class Pedidos {
  //inyecto el servicio de pedidos
  private pedidosServices = inject(PedidosServices);

  //inyecto el servicio de autenticacion
  private authentication = inject(Authentication);

  //inyecto el servicio de usuarios
  private usuariosServices = inject(UsuariosServices);

  //inyecto el servicio de clientes
  private clientesServices = inject(ClientesServices);

  //inyecto el router para poder redirigir
  private router = inject(Router);

  //hago signal de pedidos que tendra un array de pedidos y se inicializara vacia
  public pedidos = signal<Pedido[]>([]);

  //hago signal de filtroActual que tendra un string y se inicializara en 'todos'
  public filtroActual = signal<string>('todos');

  //signal para almacenar usuarios de empresa
  public usuarios = signal<Usuario[]>([]);

  //signal para almacenar clientes de empresa
  public clientes = signal<Cliente[]>([]);

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

    //obtengo los usuarios de la empresa y los asigno al signal de usuarios
    this.cargarUsuarios(usuario.empresa_id);

    //obtengo los clientes de la empresa y los asigno al signal de clientes
    this.cargarClientes(usuario.empresa_id);
  }

  //funcion para obtener los pedidos de la empresa
  obtenerPedidos(empresa_id: number): void {
    this.pedidosServices.getPedidosByEmpresa(empresa_id).subscribe((pedidos) => {
      this.pedidos.set(pedidos);
    });
  }

  //funcion para calcular porcentaje de pago
  calcularPorcentajePago(acordado: number, pagado: number): number {
    if (!acordado || acordado === 0) return 0;
    return Math.round((pagado / acordado) * 100);
  }

  //funcion para filtrar segun el boton pulsado
  filtrarPedidos(filtro: string): void {
    //asigno el filtro al signal de filtroActual
    this.filtroActual.set(filtro);

    //si es diferente a todos
    if (filtro !== 'todos') {
      this.pedidosServices
        .getPedidosByEmpresa(this.authentication.obtenerUsuarioSesion()!.empresa_id)
        .subscribe((pedidos) => {
          this.pedidos.set(pedidos.filter((pedido) => pedido.estado_fabricacion === filtro));
        });
    } else {
      this.obtenerPedidos(this.authentication.obtenerUsuarioSesion()!.empresa_id);
    }
  }

  //funcion para cargar los usuarios de una empresa
  cargarUsuarios(empresa_id: number): void {
    this.usuariosServices.getUsuarioPorEmpresa(empresa_id).subscribe((usuarios) => {
      this.usuarios.set(usuarios);
      console.log(this.usuarios());
    });
  }

  // Funcion para transformar el ID en Nombre buscando en el Signal de usuarios
  getNombreOperario(id: any): string {
    if (!id) return 'Sin asignar';

    // Buscamos en el array del signal.
    // Usamos == para comparar por si uno es string y otro numero
    const operario = this.usuarios().find((u) => u.id == id);

    return operario ? operario.nombre : 'Cargando...';
  }

  //funcion para cargar todos los clientes de la empresa
  cargarClientes(empresa_id: number): void {
    this.clientesServices.getClientePorEmpresa(empresa_id).subscribe((clientes) => {
      this.clientes.set(clientes);
      console.log(this.clientes());
    });
  }

  // Funcion para transformar el ID en Nombre buscando en el Signal de clientes
  getNombreCliente(id: any): string {
    if (!id) return 'Sin asignar';

    // Buscamos en el array del signal.
    // Usamos == para comparar por si uno es string y otro numero
    const cliente = this.clientes().find((c) => c.id == id);

    return cliente ? cliente.nombre_empresa_o_particular : 'Cargando...';
  }
}
