import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ComprobarUsuarioEmpresa } from '../../services/comprobar-usuario-empresa';
import { Authentication } from '../../services/authentication';

@Component({
  selector: 'app-inicioadmin',
  imports: [MatIconModule, CommonModule],
  templateUrl: './inicioadmin.html',
  styleUrl: './inicioadmin.css',
})
export class Inicioadmin {
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa);
  private authentication = inject(Authentication);
  private router = inject(Router);
  
  ngOnInit() {
    this.comprobarUsuarioEmpresa.comprobarUsuarioEmpresa();
    }

    cerrarSesion() {
      this.authentication.cerrarSesion();
      this.router.navigate(['/sesioncerrada']);
    }

}
