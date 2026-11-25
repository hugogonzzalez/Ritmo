import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TimeoutError, catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { getApiErrorMessage } from '../services/api-error.util';

// Manejo global de errores:
// - 401: lo gestiona authInterceptor (renovar sesión o volver al login), aquí solo se deja pasar
// - 403: sin permiso -> aviso de acceso denegado
// - red, timeout, 5xx y respuestas que no son JSON válido -> mensaje claro
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const alerts = inject(AlertService);

  return next(request).pipe(catchError((error: unknown) => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
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
