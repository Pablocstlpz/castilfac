import { Component, inject, signal, computed } from '@angular/core';
import { UsuariosServices } from '../../../services/usuarios';
import { Usuario } from '../../../interfaces/usuario';
import { Router } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerCargaDatos } from '../../partes-html/spinner-carga-datos/spinner-carga-datos';

@Component({
  selector: 'app-gestion-personal',
  imports: [MatIcon, DatePipe, UpperCasePipe, FormsModule, TranslatePipe, SpinnerCargaDatos],
  templateUrl: './gestion-personal.html',
  styleUrl: './gestion-personal.css',
})
export class GestionPersonal {
  private usuariosServices = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private router = inject(Router);
  private translate = inject(TranslateService);

  public usuarios = signal<Usuario[]>([]);
  public busqueda = signal<string>('');
  public filtroRol = signal<string>('todos');
  public cargando = signal<boolean>(true);

  public usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const rol = this.filtroRol();
    return this.usuarios().filter((u) => {
      const coincideBusqueda =
        !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const coincideRol = rol === 'todos' || u.rol === rol;
      return coincideBusqueda && coincideRol;
    });
  });

  ngOnInit(): void {
    const usuario = this.authentication.obtenerUsuarioSesion();
    if (!usuario) { this.router.navigate(["/sesioncerrada"]); return; }
    this.obtenerUsuarios(usuario.empresa_id);
  }

  //funcion para obtener los usuarios de la empresa
  obtenerUsuarios(empresa_id: number): void {
    this.usuariosServices.getUsuarioPorEmpresa(empresa_id).subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  //funcion para borrar un usuario
  borrarUsuario(id: number): void {
    Swal.fire({
      title: this.translate.instant('staff.deleteTitle'),
      text: this.translate.instant('staff.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: this.translate.instant('staff.confirmDelete'),
      cancelButtonText: this.translate.instant('common.cancel'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.usuariosServices.deleteUsuario(id).subscribe({
        next: (response) => {
          if (response.message === 'Usuario eliminado correctamente') {
            const admin = this.authentication.obtenerUsuarioSesion();
            if (admin) {
              this.obtenerUsuarios(admin.empresa_id);
            }
            void Swal.fire({
              title: this.translate.instant('staff.deletedTitle'),
              text: this.translate.instant('staff.deletedText'),
              icon: 'success',
              confirmButtonColor: '#2563eb',
            });
          }
        },
        error: (err: Error & { status?: number }) => {
          const hasAssociatedData = err.status === 409;
          void Swal.fire({
            title: hasAssociatedData
              ? this.translate.instant('staff.deleteBlockedTitle')
              : 'Error',
            text: hasAssociatedData
              ? this.translate.instant('staff.deleteBlockedText')
              : (err.message ?? this.translate.instant('staff.deleteError')),
            icon: hasAssociatedData ? 'warning' : 'error',
            confirmButtonColor: '#2563eb',
          });
        },
        });
      });
  }

  //funcion para crear un usuario
  crearUsuario(): void {
    this.router.navigate(['/inicioadmin/formulario-usuario']);
  }

  //funcion para editar un usuario
  editarUsuario(usuario: Usuario): void {
    this.router.navigate(['/inicioadmin/formulario-usuario'], {
      // Redirige a la página del formulario para editar el usuario seleccionado, pasando el ID del usuario como parámetro en la URL para que el formulario pueda cargar los datos del usuario y permitir su edición.
      queryParams: { id: usuario.id },
    });
  }
}
