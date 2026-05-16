import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Authentication } from '../../../services/authentication';

@Component({
  selector: 'app-barra-lateral',
  imports: [MatIcon, RouterLink, RouterLinkActive, UpperCasePipe, TranslatePipe],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.css',
})
export class BarraLateral {
  private authentication = inject(Authentication);
  private router = inject(Router);

  @Input() menuMovilAbierto = false;
  @Output() cerrarMenu = new EventEmitter<void>();

  public usuario = this.authentication.obtenerUsuarioSesion();

  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }

  cerrarMenuMovil() {
    this.cerrarMenu.emit();
  }
}
