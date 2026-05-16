import {
  HttpClient,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { Authentication } from '../services/authentication';
import { environment } from '../../environments/environment';

// Endpoints PUBLICOS que NO deben llevar Authorization ni redirigir en 401.
const RUTAS_PUBLICAS = [
  '/usuarios/login',
  '/usuarios/registro-inicial',
  '/usuarios/recuperar-password',
  '/usuarios/restablecer-password',
  '/auth/google',
  '/auth/refresh',
  '/empresas/reenviar-verificacion',
  '/empresas/verificar/',
  '/empresas/registro',
  '/stripe/webhook',
];

function esRutaPublica(url: string): boolean {
  return RUTAS_PUBLICAS.some((ruta) => url.includes(ruta));
}

// Estado del refresh en curso. Si llegan 5 peticiones al mismo tiempo y todas
// reciben 401, queremos pedir UN solo refresh y que las demas esperen. Sin esto
// pediriamos 5 refresh en paralelo (en el mejor caso) o pelearia el orden.
let refreshEnCurso = false;
const tokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Authentication);
  const router = inject(Router);
  const http = inject(HttpClient);

  const url = req.url;
  const publica = esRutaPublica(url);

  // 1) Inyectar Bearer si no es publica
  const peticionConToken = publica ? req : addBearer(req, auth.obtenerToken());

  return next(peticionConToken).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 en una ruta publica = credenciales/refresh malos -> propagar tal cual.
      if (error.status === 401 && !publica) {
        // Intentamos refresh UNA sola vez.
        return manejar401(req, next, auth, router, http);
      }

      // 403 = sin permisos o sin suscripcion.
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

function addBearer(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function manejar401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: Authentication,
  router: Router,
  http: HttpClient,
): Observable<any> {
  const refreshToken = auth.obtenerRefreshToken();

  // Sin refresh token, no podemos hacer nada -> cerramos sesion.
  if (!refreshToken) {
    auth.cerrarSesion();
    router.navigate(['/sesioncerrada']);
    return throwError(() => new Error('Sesion expirada'));
  }

  // Si ya hay un refresh en curso, esperamos a que termine y reintentamos.
  if (refreshEnCurso) {
    return tokenSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((nuevoToken) => next(addBearer(req, nuevoToken))),
    );
  }

  // Disparamos el refresh. Marcamos en curso y reseteamos el subject.
  refreshEnCurso = true;
  tokenSubject.next(null);

  return http
    .post<{ accessToken: string; refreshToken?: string }>(
      `${environment.apiUrl}/auth/refresh`,
      { refreshToken },
    )
    .pipe(
      switchMap((tokens) => {
        auth.actualizarTokens(tokens);
        refreshEnCurso = false;
        tokenSubject.next(tokens.accessToken);
        // Reintentamos la peticion original con el nuevo access token.
        return next(addBearer(req, tokens.accessToken));
      }),
      catchError((refreshError) => {
        // Refresh fallo -> sesion realmente terminada.
        refreshEnCurso = false;
        tokenSubject.next(null);
        auth.cerrarSesion();
        router.navigate(['/sesioncerrada']);
        return throwError(() => refreshError);
      }),
    );
}
