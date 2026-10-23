import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly requestTimeout = environment.apiTimeoutMs;

  private headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
  }

  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    return this.handle(
      this.http
        .get<T>(this.buildUrl(endpoint), {
          headers: this.headers(),
          params: this.buildParams(params)
        })
        .pipe(timeout(this.requestTimeout))
    );
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.handle(
      this.http
        .post<T>(this.buildUrl(endpoint), body, { headers: this.headers() })
        .pipe(timeout(this.requestTimeout))
    );
  }

  async patch<T>(endpoint: string, body: unknown = {}): Promise<T> {
    return this.handle(
      this.http
        .patch<T>(this.buildUrl(endpoint), body, { headers: this.headers() })
        .pipe(timeout(this.requestTimeout))
    );
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.handle(
      this.http
        .delete<T>(this.buildUrl(endpoint), { headers: this.headers() })
        .pipe(timeout(this.requestTimeout))
    );
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
  }

  private buildParams(params?: QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && typeof value !== 'undefined') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  // Las respuestas llegan como ApiResponse<T>; cada servicio decide qué devuelve.
  private async handle<T>(request$: Observable<T>): Promise<T> {
    return firstValueFrom(request$);
  }
}
