import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/api.model';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error ? error.message : fallback;
  }

  const body = error.error as ApiErrorBody | null;
  const validation = body?.errors
    ?.map(item => item.message ?? item.msg)
    .filter((message): message is string => Boolean(message));

  return validation?.length ? validation.join('. ') : body?.message ?? fallback;
}
