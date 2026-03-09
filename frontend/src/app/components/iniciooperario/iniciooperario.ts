import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Authentication } from '../../services/authentication';
import { Router } from '@angular/router';
import { ComprobarUsuarioEmpresa } from '../../services/comprobar-usuario-empresa';
import { Usuario } from '../../interfaces/usuario';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-iniciooperario',
  imports: [CommonModule, MatIconModule, UpperCasePipe],
  templateUrl: './iniciooperario.html',
  styleUrl: './iniciooperario.css',
})
export class Iniciooperario {

  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos
  private router = inject(Router); // Inyectamos el  Router para poder redirigir
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa); // Inyectamos el servicio ComprobarUsuarioEmpresa para poder utilizar sus metodos
  public usuario: Usuario = this.authentication.obtenerUsuarioSesion(); // Inyectamos el servicio Usuario para poder utilizar sus metodos

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo a traves de la funcion para reutilizar que cree
    this.comprobarUsuarioEmpresa.comprobarUsuarioEmpresa();
  }

  //cerrar sesion
  cerrarSesion() {
    this.authentication.cerrarSesion();
    this.router.navigate(['/sesioncerrada']);
  }
}
