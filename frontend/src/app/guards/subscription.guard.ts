import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';
import { EmpresasServices } from '../services/empresas';
import { map, catchError, of } from 'rxjs';

export const subscriptionGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);
  const empresasServices = inject(EmpresasServices);

  // obtengo el usuario de la sesion
  const usuario = auth.obtenerUsuarioSesion();

  // si no hay usuario rediriggo al login
  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  // obtengo la empresa del usuario para comprobar su suscripcion
  return empresasServices.getEmpresa(usuario.empresa_id).pipe(
    map((empresa) => {
      // verifico si la suscripcion esta activa
      if (!empresa.suscripcion_activa) {
        const ahora = new Date();
        const fechaVencimiento = empresa.fecha_vencimiento
          ? new Date(empresa.fecha_vencimiento)
          : null;

        // si el trial ha vencido rediriggo a la pantalla de pago
        if (!fechaVencimiento || ahora > fechaVencimiento) {
          return router.createUrlTree(['/stripe-pagos']);
        }
      }

      // si todo esta bien dejo pasar
      return true;
    }),
    catchError(() => {
      // si falla al obtener la empresa lo trato como trial vencido
      return of(router.createUrlTree(['/stripe-pagos']));
    }),
  );
};
