import { Component } from '@angular/core';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { Authentication } from '../../../services/authentication';
import { inject } from '@angular/core';
import { EmpresasServices } from '../../../services/empresas';
import { Usuario } from '../../../interfaces/usuario';
import { Empresa } from '../../../interfaces/empresa';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logincorrecto',
  imports: [RouterModule, CommonModule],
  templateUrl: './logincorrecto.html',
  styleUrl: './logincorrecto.css',
})
export class Logincorrecto {

  private authentication = inject(Authentication); // Inyectamos el servicio Authentication para poder utilizar sus metodos
  private router = inject(Router); // Inyectamos el  Router para poder redirigir
  private empresasServices = inject(EmpresasServices); // Inyectamos el servicio EmpresasServices para poder utilizar sus metodos
  
  //al cargar la pagina
  ngOnInit(): void {
    //obtengo el usuario de la sesion guardada al loguear
    const usuario = this.authentication.obtenerUsuarioSesion();

    //compuebo si hay usuario, si no hay(no ha hecho login), redirijo a que no tiene permisos
    if (!usuario) {
      //si no hay usuario, redirijo a la pagina de no permisos
      this.router.navigate(['/nopermisos']);
    }
  
      //obtengo la empresa del usuario
      this.empresasServices.getEmpresa(usuario.empresa_id).subscribe((empresa: Empresa) => {
        //verifico si tiene sucripcion activa o no
        if (empresa.suscripcion_activa === false) {
          //si no tiene sucripcion activa, redirijo a la pagina de no suscripcion
          this.router.navigate(['/nosubscripcion']);
        }
      });
  
  }

}
