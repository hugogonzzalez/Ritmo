import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TimeoutError, catchError, throwError } from 'rxjs';
import { AuthStore } from '../stores/auth.store';
import { AlertService } from '../services/alert.service';
import { getApiErrorMessage } from '../services/api-error.util';

// Manejo global de errores:
// - 401: sesión caducada o inválida -> se limpia la sesión y se va al login
// - 403: sin permiso -> aviso de acceso denegado
// - red, timeout, 5xx y respuestas que no son JSON válido -> mensaje claro
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const alerts = inject(AlertService);
  const authStore = inject(AuthStore);
  const router = inject(Router);
  // Login y comprobación de sesión (auth/me) gestionan su propio 401: no deben disparar el aviso global
  const isAuthRequest = request.url.endsWith('/auth/login') || request.url.endsWith('/auth/me');

  return next(request).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      // El login muestra su propio mensaje y auth/me se resuelve en AuthService; el resto cierra la sesión
      if (!isAuthRequest) {
        authStore.logout();
        void alerts.error('Sesión caducada', 'Vuelve a iniciar sesión para continuar.');
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }

    if (error instanceof HttpErrorResponse && error.status === 403) {
      void alerts.error('Acceso denegado', 'No tienes permiso para realizar esta acción.');
      return throwError(() => error);
    }

    const message = describeError(error);
    if (message) void alerts.error('No se ha podido completar la operación', message);
    return throwError(() => error);
  }));
};

function describeError(error: unknown): string {
  if (error instanceof TimeoutError) {
    return 'La API tarda demasiado en responder. Inténtalo de nuevo.';
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se puede conectar con la API. Comprueba que el backend esté arrancado.';
    }
    if (error.status >= 500) {
      return 'El servidor ha encontrado un error. Inténtalo de nuevo.';
    }
    // Un cuerpo que no es un objeto JSON (HTML, texto suelto o JSON roto) no es una respuesta válida de la API
    if (typeof error.error !== 'object' || error.error === null) {
      return 'El servidor ha devuelto una respuesta no válida.';
    }
  }

  return getApiErrorMessage(error, 'Ha ocurrido un error inesperado.');
}
