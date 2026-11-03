import { HttpInterceptorFn } from '@angular/common/http';

export const requestInterceptor: HttpInterceptorFn = (request, next) => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (request.body !== null && typeof request.body !== 'undefined') {
    headers['Content-Type'] = 'application/json';
  }
  return next(request.clone({ setHeaders: headers }));
};
