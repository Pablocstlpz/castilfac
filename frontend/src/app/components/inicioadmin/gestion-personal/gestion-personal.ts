import { Component, inject, signal } from '@angular/core';
import { UsuariosServices } from '../../../services/usuarios';
import { Usuario } from '../../../interfaces/usuario';
import { Router } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { MatIcon } from "@angular/material/icon";
import { DatePipe } from '@angular/common';
import { UpperCasePipe } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-personal',
  imports: [MatIcon, DatePipe, UpperCasePipe],
  templateUrl: './gestion-personal.html',
  styleUrl: './gestion-personal.css',
})
export class GestionPersonal {

  //inyecto el servicio de usuarios
  private usuariosServices = inject(UsuariosServices);
  //inyecto el servicio de autenticacion
  private authentication = inject(Authentication);
  //inyecto el router para poder redirigir
  private router = inject(Router);
  //creo un signal de usuarios que tendra una array de usuarios y se inicializaera vacia
  public usuarios = signal<Usuario[]>([]);

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo si hay usuario en la sesion
    const usuario = this.authentication.obtenerUsuarioSesion();
    //si no hay usuario o no es admin
    if (usuario === null || usuario.rol !== 'admin') {
      //redirijo a la pagina de no autorizado
      this.router.navigate(['/no-autorizado']);
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
            text: err.message ?? 'No se pudo eliminar el empleado.',
            icon: 'error',
            confirmButtonColor: '#2563eb',
          });
        },
      });
    });
  }

  //funcion para crear un usuario
  crearUsuario(): void {
    this.router.navigate(['/crear-usuario']);
  }

  //funcion para editar un usuario
  editarUsuario(usuario: Usuario): void {
    this.router.navigate(['/formulario'], { // Redirige a la página del formulario para editar el usuario seleccionado, pasando el ID del usuario como parámetro en la URL para que el formulario pueda cargar los datos del usuario y permitir su edición.
      queryParams: { id: usuario.id }
    });

  }

}

//FALTA AÑADIR USUARIO Y EDITAR USUARIO, HAY QUE HACE SU FORMULARIO PARA ESTAS FUNCIONES
