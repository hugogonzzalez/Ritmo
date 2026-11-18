export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  // Solo llega en los listados paginados del admin
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: Array<{ field?: string; path?: string; message?: string; msg?: string }>;
}

export type QueryParamsValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryParamsValue>;
