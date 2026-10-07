export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: Array<{ field?: string; path?: string; message?: string; msg?: string }>;
}
