import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EmpresasServices } from './empresas';
import { Authentication } from './authentication';
import { Empresa } from '../interfaces/empresa';
import { Usuario } from '../interfaces/usuario';

@Injectable({
  providedIn: 'root',
})
export class ComprobarUsuarioEmpresa {
  private auth = inject(Authentication);
  private router = inject(Router);
  private empresasServices = inject(EmpresasServices);

  // funcion que usare repetgidas veces, asi no repito codigo
  comprobarUsuarioEmpresa(): void {
    const usuario: Usuario | null = this.auth.obtenerUsuarioSesion();

    // si no hay usuario (no ha hecho login)
    if (!usuario) {
      this.router.navigate(['/nopermisos']);
      return;
    }

    // obtengo la empresa del usuario
    this.empresasServices.getEmpresa(usuario.empresa_id).subscribe({
      next: (empresa: Empresa) => {
        // verifico si tiene suscripción activa o no
        if (empresa.suscripcion_activa === false) {
          this.router.navigate(['/nosubscripcion']);
          return;
        }

        // si es operario, redirijo a la página de iniciooperario
        if (usuario.rol === 'operario') {
          this.router.navigate(['/iniciooperario']);
        }

        // si es admin, redirijo a la página de admin
        if (usuario.rol === 'admin') {
          this.router.navigate(['/inicioadmin']);
        }
      },
      error: () => {
        // si falla al obtener la empresa, lo trato como sin suscripción
        this.router.navigate(['/nosubscripcion']);
      },
    });
  }
}