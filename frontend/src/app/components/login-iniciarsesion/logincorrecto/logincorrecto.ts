import { Component } from '@angular/core';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { inject } from '@angular/core';
import { EmpresasServices } from '../../../services/empresas';
import { Usuario } from '../../../interfaces/usuario';
import { Empresa } from '../../../interfaces/empresa';
import { CommonModule } from '@angular/common';
import { ComprobarUsuarioEmpresa } from '../../../services/comprobar-usuario-empresa';

@Component({
  selector: 'app-logincorrecto',
  imports: [RouterModule, CommonModule],
  templateUrl: './logincorrecto.html',
  styleUrl: './logincorrecto.css',
})
export class Logincorrecto {
  
  private comprobarUsuarioEmpresa = inject(ComprobarUsuarioEmpresa); // Inyectamos el servicio ComprobarUsuarioEmpresa para poder utilizar sus metodos

  //al cargar la pagina
  ngOnInit(): void {
    //compruebo a traves de la funcion para reutilizar que cree
    this.comprobarUsuarioEmpresa.comprobarUsuarioEmpresa();
  }

}
