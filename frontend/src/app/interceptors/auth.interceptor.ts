import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Authentication } from '../services/authentication';

// Endpoints publicos que NO deben llevar Authorization ni redirigir en 401.
// Si tu backend monta mas rutas publicas anyadelas aqui.
const RUTAS_PUBLICAS = [
  '/usuarios/login',
  '/usuarios/registro-inicial',
  '/usuarios/recuperar-password',
  '/usuarios/restablecer-password',
  '/auth/google',
  '/empresas/reenviar-verificacion',
  '/empresas/verificar/',
  '/stripe/webhook',
];

function esRutaPublica(url: string): boolean {
  // POST /empresas (registro publico) es publico, pero GET /empresas/:id NO lo es,
  // por lo que el filtrado por URL + metodo lo hacemos abajo en el interceptor.
  return RUTAS_PUBLICAS.some((ruta) => url.includes(ruta));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Authentication);
  const router = inject(Router);

  const url = req.url;
  const metodo = req.method.toUpperCase();

  // Caso especial: POST /api/empresas (alta de empresa en registro) es publico
  // pero comparte URL con otros verbos que SI requieren JWT.
  const esAltaEmpresa = metodo === 'POST' && /\/empresas(\?|$)/.test(url);

  // Si la peticion va a una ruta publica, NO inyectamos token.
  const publica = esRutaPublica(url) || esAltaEmpresa;

  let peticion = req;
  if (!publica) {
    const token = auth.obtenerToken();
    if (token) {
      peticion = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 = token invalido o expirado -> cerramos sesion y mandamos al login.
      // Solo lo hacemos si la peticion NO era publica (en publicas el 401 es
      // logico, por ejemplo credenciales malas en /login).
      if (error.status === 401 && !publica) {
        auth.cerrarSesion();
        router.navigate(['/sesioncerrada']);
      }

      // 403 = no autorizado por rol o suscripcion.
      // Si es "SUSCRIPCION_REQUERIDA" mandamos a la pantalla de pago.
      // En cualquier otro 403 mandamos a /nopermisos.
      if (error.status === 403 && !publica) {
        const tipo = error.error?.tipo;
        if (tipo === 'SUSCRIPCION_REQUERIDA') {
          router.navigate(['/stripe-pagos']);
        } else {
          router.navigate(['/nopermisos']);
        }
      }

      return throwError(() => error);
    }),
  );
};
