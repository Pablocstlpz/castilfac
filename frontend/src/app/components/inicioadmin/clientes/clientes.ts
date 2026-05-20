import { Component, inject, signal, OnInit, computed } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from '../../../interfaces/cliente';
import { ClientesServices } from '../../../services/clientes';
import { Authentication } from '../../../services/authentication';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

//pantalla del admin para listar, buscar, crear, editar y borrar clientes de la empresa
@Component({
  selector: 'app-clientes',
  imports: [CommonModule, MatIconModule, FormsModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  private clientesService = inject(ClientesServices);
  private authentication = inject(Authentication);
  private router = inject(Router);
  private translate = inject(TranslateService);

  //signal con todos los clientes de la empresa que vienen del backend
  public clientesArray = signal<Cliente[]>([]);
  //texto que ha escrito el usuario en la busqueda
  public busqueda = signal<string>('');
  //tipo de cliente por el que esta filtrando (particular, empresa, vip, mayorista o todos)
  public filtroTipo = signal<string>('todos');
  public cargando = signal<boolean>(true);

  //listado de clientes filtrados que se muestran en la tabla
  //se recalcula automaticamente al cambiar busqueda o filtroTipo
  public clientesFiltrados = computed(() => {
    return this.clientesArray().filter((c) => {
      //busco coincidencia por nombre o por NIF/CIF
      const coincideBusqueda =
        c.nombre_empresa_o_particular.toLowerCase().includes(this.busqueda().toLowerCase()) ||
        c.nif_cif?.toLowerCase().includes(this.busqueda().toLowerCase());
      const coincideTipo = this.filtroTipo() === 'todos' || c.tipo_cliente === this.filtroTipo();
      return coincideBusqueda && coincideTipo;
    });
  });

  ngOnInit(): void {
    //al entrar a la pagina cojo el empresa_id de la sesion y cargo sus clientes
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(["/sesioncerrada"]); return; }
    this.cargarClientes(usuario.empresa_id);
  }

  //funcion para cargar los clientes de una empresa
  cargarClientes(empresa_id: number): void {
    this.clientesService.getClientePorEmpresa(empresa_id).subscribe({
      next: (clientes) => {
        this.clientesArray.set(clientes);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  //funcion para ir al detalle del cliente
  verCliente(id: number): void {
    this.router.navigate(['/inicioadmin/clientes/detalle-cliente', id]);
  }

  //funcion para ir al formulario de creacion de cliente
  crearCliente(): void {
    this.router.navigate(['/inicioadmin/clientes/formulario-cliente']);
  }

  //funcion para ir al formulario en modo edicion, pasandole el id por queryParam
  editarCliente(cliente: Cliente): void {
    this.router.navigate(['/inicioadmin/clientes/formulario-cliente'], {
      queryParams: { id: cliente.id },
    });
  }

  //funcion para borrar un cliente con confirmacion previa via SweetAlert
  eliminarCliente(id: number): void {
    Swal.fire({
      title: this.translate.instant('clients.deleteTitle'),
      text: this.translate.instant('clients.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: this.translate.instant('clients.confirmDelete'),
      cancelButtonText: this.translate.instant('common.cancel'),
    }).then((result) => {
      //si el usuario cancela la confirmacion no hago nada
      if (!result.isConfirmed) return;

      this.clientesService.deleteCliente(id).subscribe({
        next: () => {
          //refresco el listado para que el cliente borrado desaparezca
          const usuario = this.authentication.obtenerUsuarioSesion();
          if (usuario) this.cargarClientes(usuario.empresa_id);
          void Swal.fire({
            title: this.translate.instant('clients.deletedTitle'),
            text: this.translate.instant('clients.deletedText'),
            icon: 'success',
            confirmButtonColor: '#2563eb',
          });
        },
        error: (err: Error & { status?: number }) => {
          //si el cliente tiene pedidos asociados el backend devuelve 409 y muestro un mensaje especifico
          //porque no se puede borrar para no romper la relacion con pedidos/presupuestos
          const hasAssociatedData = err.status === 409;
          void Swal.fire({
            title: hasAssociatedData
              ? this.translate.instant('clients.deleteBlockedTitle')
              : 'Error',
            text: hasAssociatedData
              ? this.translate.instant('clients.deleteBlockedText')
              : (err.message ?? this.translate.instant('clients.deleteError')),
            icon: hasAssociatedData ? 'warning' : 'error',
            confirmButtonColor: '#2563eb',
          });
        },
      });
    });
  }
}
