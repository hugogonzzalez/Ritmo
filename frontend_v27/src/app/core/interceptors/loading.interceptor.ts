import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return next(request);
  const loading = inject(LoadingService);
  loading.show();
  return next(request).pipe(finalize(() => loading.hide()));
};
