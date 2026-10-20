import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertService } from './alert.service';
import { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly alerts = inject(AlertService);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  async get<T>(endpoint: string, params?: Record<string, string | boolean | number>): Promise<T> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      httpParams = httpParams.set(key, String(value));
    }
    return this.resolve(this.http.get<T>(this.url(endpoint), { params: httpParams }), 'La API tardó demasiado en responder.');
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.resolve(this.http.post<T>(this.url(endpoint), body), 'La API tardó demasiado en responder.');
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.resolve(this.http.put<T>(this.url(endpoint), body), 'La API tardó demasiado en responder.');
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.resolve(this.http.patch<T>(this.url(endpoint), body ?? {}), 'La API tardó demasiado en responder.');
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.resolve(this.http.delete<T>(this.url(endpoint)), 'La API tardó demasiado en responder.');
  }

  private url(endpoint: string): string {
    return `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  }

  private async resolve<T>(request: import('rxjs').Observable<T>, timeoutMessage: string): Promise<T> {
    try {
      const result = await firstValueFrom(request.pipe(timeout(environment.apiTimeoutMs)));
      if (result && typeof result === 'object' && 'success' in result && result.success === true && 'data' in result) {
        return (result as unknown as ApiResponse<T>).data;
      }
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        await this.alerts.error('Tiempo de espera agotado', timeoutMessage);
      }
      throw error;
    }
  }
}
