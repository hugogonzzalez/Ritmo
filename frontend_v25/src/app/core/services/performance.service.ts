import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Performance, PerformancePayload, PerformanceStatus } from '../models/performance.model';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Performance[]>> {
    return this.api.get<ApiResponse<Performance[]>>('performances', params);
  }

  async getById(id: string): Promise<ApiResponse<Performance>> {
    return this.api.get<ApiResponse<Performance>>(`performances/${id}`, { includeInactive: true });
  }

  async create(payload: PerformancePayload): Promise<ApiResponse<Performance>> {
    return this.api.post<ApiResponse<Performance>>('performances', payload);
  }

  async update(id: string, payload: Partial<PerformancePayload>): Promise<ApiResponse<Performance>> {
    return this.api.patch<ApiResponse<Performance>>(`performances/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Performance>> {
    return this.api.patch<ApiResponse<Performance>>(`performances/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Performance>> {
    return this.api.delete<ApiResponse<Performance>>(`performances/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Performance>> {
    return this.api.patch<ApiResponse<Performance>>(`performances/${id}/restore`, {});
  }

  async getBySlug(slug: string): Promise<ApiResponse<Performance>> {
    return this.api.get<ApiResponse<Performance>>(`performances/slug/${slug}`);
  }

  async changeStatus(id: string, status: PerformanceStatus): Promise<ApiResponse<Performance>> {
    return this.api.patch<ApiResponse<Performance>>(`performances/${id}/status`, { status });
  }
}
