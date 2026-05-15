import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';

export const roleGuard = (rolRequerido: string): CanActivateFn => () => {
  const auth = inject(Authentication);
  const router = inject(Router);
  const usuario = auth.obtenerUsuarioSesion();
  if (!usuario || usuario.rol !== rolRequerido) {
    return router.createUrlTree(['/nopermisos']);
  }
  return true;
};
