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

@Component({
  selector: 'app-clientes',
  imports: [CommonModule, MatIconModule, FormsModule, TranslatePipe],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  private clientesService = inject(ClientesServices);
  private authentication = inject(Authentication);
  private router = inject(Router);
  private translate = inject(TranslateService);

  public clientesArray = signal<Cliente[]>([]);
  public busqueda = signal<string>('');
  public filtroTipo = signal<string>('todos');

  public clientesFiltrados = computed(() => {
    return this.clientesArray().filter((c) => {
      const coincideBusqueda =
        c.nombre_empresa_o_particular.toLowerCase().includes(this.busqueda().toLowerCase()) ||
        c.nif_cif?.toLowerCase().includes(this.busqueda().toLowerCase());
      const coincideTipo = this.filtroTipo() === 'todos' || c.tipo_cliente === this.filtroTipo();
      return coincideBusqueda && coincideTipo;
    });
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion()!;
    this.cargarClientes(usuario.empresa_id);
  }

  cargarClientes(empresa_id: number): void {
    this.clientesService.getClientePorEmpresa(empresa_id).subscribe((clientes) => {
      this.clientesArray.set(clientes);
    });
  }

  verCliente(id: number): void {
    this.router.navigate(['/inicioadmin/clientes/detalle-cliente', id]);
  }

  crearCliente(): void {
    this.router.navigate(['/inicioadmin/clientes/formulario-cliente']);
  }

  editarCliente(cliente: Cliente): void {
    this.router.navigate(['/inicioadmin/clientes/formulario-cliente'], {
      queryParams: { id: cliente.id },
    });
  }

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
      if (!result.isConfirmed) return;

      this.clientesService.deleteCliente(id).subscribe({
        next: () => {
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
