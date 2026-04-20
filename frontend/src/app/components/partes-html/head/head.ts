import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Authentication } from '../../../services/authentication';

@Component({
  selector: 'app-head',
  imports: [RouterLink],
  templateUrl: './head.html',
  styleUrl: './head.css',
})
export class Head {
  private authentication = inject(Authentication);
  private router = inject(Router);

  get usuario() {
    return this.authentication.obtenerUsuarioSesion();
  }

  cerrarSesion(): void {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  rutaInicio(): string {
    if (this.usuario?.rol === 'admin') {
      return '/inicioadmin';
    } else if (this.usuario?.rol === 'operario') {
      return '/iniciooperario';
    } else {
      return '/';
    }
  }
}
