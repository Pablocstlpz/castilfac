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
        // Si no tiene suscripción activa, verificar si el trial también ha vencido
        if (!empresa.suscripcion_activa) {
          const ahora = new Date();
          const fechaVencimiento = empresa.fecha_vencimiento
            ? new Date(empresa.fecha_vencimiento)
            : null;

          if (!fechaVencimiento || ahora > fechaVencimiento) {
            // Trial expirado → pantalla de pago
            this.router.navigate(['/stripe-pagos']);
            return;
          }
          // Dentro del trial pero sin suscripción pagada → dejar pasar
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
        this.router.navigate(['/stripe-pagos']);
      },
    });
  }
}