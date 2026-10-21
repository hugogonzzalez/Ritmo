import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Performance, PerformancePayload } from '../models/performance.model';

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
}
