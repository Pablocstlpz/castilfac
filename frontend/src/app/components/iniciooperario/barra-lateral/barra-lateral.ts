import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { Authentication } from '../../../services/authentication';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive, UpperCasePipe],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  private authentication = inject(Authentication);
  private router = inject(Router);

  public usuario = this.authentication.obtenerUsuarioSesion();

  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
