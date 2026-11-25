import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertService } from '../services/alert.service';
import { AuthStore } from '../stores/auth.store';

// Si varias peticiones reciben 401 a la vez, todas esperan el MISMO /auth/refresh.
let refreshInFlight: Observable<unknown> | null = null;

// Rutas de auth que nunca se reintentan: evita bucles (/refresh -> 401 -> /refresh...)
const NO_RETRY = /\/auth\/(login|register|refresh|logout)$/;

// Páginas públicas: si la sesión se pierde aquí, no se lleva a /login
const PUBLIC_PAGES = ['/shop', '/login', '/register'];

// 401 del access_token -> llama a /auth/refresh y repite la petición original.
// 401 del refresh_token -> limpia el store y, en páginas protegidas, lleva a /login.
// Ya no añade "Authorization: Bearer": los tokens viajan en cookies HttpOnly.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const store = inject(AuthStore);
  const router = inject(Router);
  const alerts = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || NO_RETRY.test(req.url)) return throwError(() => error);

      refreshInFlight ??= http
        .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          finalize(() => (refreshInFlight = null)),
          shareReplay(1)
        );

      return refreshInFlight.pipe(
        // El navegador ya tiene las cookies nuevas: se repite la petición tal cual
        switchMap(() => next(req)),
        catchError((refreshError: HttpErrorResponse) => {
          // Solo si el que ha fallado es el refresh (no la petición repetida)
          if (refreshError.url?.endsWith('/auth/refresh')) {
            const hadSession = store.isAuthenticated();
            store.logout();

            const isPublic = PUBLIC_PAGES.some(page => router.url.startsWith(page));
            const isSessionCheck = req.url.endsWith('/auth/me');
            if (!isPublic && !isSessionCheck) {
              void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
              if (hadSession) void alerts.error('Sesión caducada', 'Vuelve a iniciar sesión para continuar.');
            }
          }
          return throwError(() => refreshError);
        })
      );
    })
  );
};
