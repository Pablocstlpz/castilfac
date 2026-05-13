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

@Component({
  selector: 'app-gestion-personal',
  imports: [MatIcon, DatePipe, UpperCasePipe, FormsModule],
  templateUrl: './gestion-personal.html',
  styleUrl: './gestion-personal.css',
})
export class GestionPersonal {
  private usuariosServices = inject(UsuariosServices);
  private authentication = inject(Authentication);
  private router = inject(Router);

  public usuarios = signal<Usuario[]>([]);
  public busqueda = signal<string>('');
  public filtroRol = signal<string>('todos');

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

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo si hay usuario en la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //si no hay usuario o no es admin
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/nopermisos']);
    }

    //obtengo los usuarios de la empresa y los asigno al signal de usuarios
    this.obtenerUsuarios(usuario.empresa_id);
  }

  //funcion para obtener los usuarios de la empresa
  obtenerUsuarios(empresa_id: number): void {
    this.usuariosServices.getUsuarioPorEmpresa(empresa_id).subscribe((usuarios) => {
      this.usuarios.set(usuarios);
      console.log(usuarios);
    });
  }

  //funcion para borrar un usuario
  borrarUsuario(id: number): void {
    Swal.fire({
      title: '¿Eliminar empleado?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
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
              title: 'Eliminado',
              text: 'El empleado se ha eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#2563eb',
            });
          }
        },
        error: (err: Error) => {
          void Swal.fire({
            title: 'Error',
            text: err.message ?? 'No se pudo eliminar el empleado ya que hay datos asociados a él.',
            icon: 'error',
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
