import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Authentication);
  const router = inject(Router);

  const usuario = auth.obtenerUsuarioSesion();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
