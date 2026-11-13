import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Concert, ConcertPayload } from '../models/concert.model';
import { ShopPagination } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class ConcertService {
  private readonly api = inject(ApiService);

  // Con includeInactive=true el backend devuelve también la paginación (pagination)
  async getAll(params?: QueryParams): Promise<ApiResponse<Concert[]> & { pagination?: ShopPagination }> {
    return this.api.get<ApiResponse<Concert[]> & { pagination?: ShopPagination }>('concerts', params);
  }

  async getById(id: string): Promise<ApiResponse<Concert>> {
    return this.api.get<ApiResponse<Concert>>(`concerts/${id}`, { includeInactive: true });
  }

  async create(payload: Partial<ConcertPayload>): Promise<ApiResponse<Concert>> {
    return this.api.post<ApiResponse<Concert>>('concerts', payload);
  }

  async update(id: string, payload: Partial<ConcertPayload>): Promise<ApiResponse<Concert>> {
    return this.api.patch<ApiResponse<Concert>>(`concerts/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Concert>> {
    return this.api.patch<ApiResponse<Concert>>(`concerts/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Concert>> {
    return this.api.delete<ApiResponse<Concert>>(`concerts/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Concert>> {
    return this.api.patch<ApiResponse<Concert>>(`concerts/${id}/restore`, {});
  }

  async getBySlug(slug: string): Promise<ApiResponse<Concert>> {
    return this.api.get<ApiResponse<Concert>>(`concerts/slug/${slug}`);
  }

  async changeStatus(id: string, status: string): Promise<ApiResponse<Concert>> {
    return this.api.patch<ApiResponse<Concert>>(`concerts/${id}/status`, { status });
  }
}
