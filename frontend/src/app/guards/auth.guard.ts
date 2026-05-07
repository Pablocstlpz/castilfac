import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);

  // obtengo el usuario de la sesion
  const usuario = auth.obtenerUsuarioSesion();

  // si no hay usuario rediriggo al login
  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  // si hay usuario dejo pasar
  return true;
};
