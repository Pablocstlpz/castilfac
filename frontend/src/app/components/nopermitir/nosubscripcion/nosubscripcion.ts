import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Authentication } from '../../../services/authentication';

@Component({
  selector: 'app-nosubscripcion',
  imports: [RouterModule, CommonModule],
  templateUrl: './nosubscripcion.html',
  styleUrl: './nosubscripcion.css',
})
export class Nosubscripcion {

  //inyecto el servicio Authentication para poder utilizar sus metodos
  private authentication = inject(Authentication);
  //inyecto el Router para poder redirigir
  private router = inject(Router);

  //creo funcion de cerrar sesion
  cerrarSesion() {
    //cierro la sesion
    this.authentication.cerrarSesion();
    //redirijo a la pagina de login
    this.router.navigate(['/login']);
  }
}
