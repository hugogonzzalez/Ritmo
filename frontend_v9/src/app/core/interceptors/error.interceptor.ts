import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { getApiErrorMessage } from '../services/api-error.util';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const alerts = inject(AlertService);
  return next(request).pipe(catchError((error: unknown) => {
    let message = 'Ha ocurrido un error inesperado.';
    if (error instanceof HttpErrorResponse && error.status === 0) {
      message = 'No se puede conectar con la API. Comprueba que el backend esté arrancado.';
    } else if (error instanceof HttpErrorResponse && error.status >= 500) {
      message = 'El servidor ha encontrado un error. Inténtalo de nuevo.';
    } else {
      message = getApiErrorMessage(error, message);
    }
    void alerts.error('No se ha podido completar la operación', message);
    return throwError(() => error);
  }));
};
