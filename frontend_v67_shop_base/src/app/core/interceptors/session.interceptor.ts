import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { AlertService } from '../services/alert.service';
import { SessionService } from '../services/session.service';

// Rutas que nunca intentan renovar la sesión (si fallan con 401, el 401 es la respuesta normal)
const RUTAS_SIN_RENOVACION = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

// Si una petición responde 401 (access_token caducado), renueva la sesión y repite la petición.
// Si la renovación falla, cierra la sesión.
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const alerts = inject(AlertService);
  const router = inject(Router);
  const session = inject(SessionService);

  const puedeRenovar = !RUTAS_SIN_RENOVACION.some(ruta => request.url.endsWith(ruta));
  // La comprobación de sesión al abrir la web no debe llevar al login si el visitante es anónimo
  const esComprobacion = request.url.endsWith('/auth/me');

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !puedeRenovar) {
        return throwError(() => error);
      }

      return from(session.renovar()).pipe(
        switchMap(renovada => {
          if (renovada) return next(request);

          authStore.logout();
          if (esComprobacion) return throwError(() => error);

          void alerts.error('Sesión caducada', 'Vuelve a iniciar sesión para continuar.');
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => error);
        })
      );
    })
  );
};
