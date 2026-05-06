import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';
import { EmpresasServices } from '../services/empresas';
import { map, catchError, of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);
  const empresasService = inject(EmpresasServices);

  const usuario = auth.obtenerUsuarioSesion();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  return empresasService.getEmpresa(usuario.empresa_id).pipe(
    map((empresa) => {
      if (!empresa.suscripcion_activa) {
        const ahora = new Date();
        const fechaVencimiento = empresa.fecha_vencimiento
          ? new Date(empresa.fecha_vencimiento)
          : null;

        if (!fechaVencimiento || ahora > fechaVencimiento) {
          return router.createUrlTree(['/stripe-pagos']);
        }
      }
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/stripe-pagos']))),
  );
};
