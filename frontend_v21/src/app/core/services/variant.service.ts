import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Variant, VariantPayload } from '../models/variant.model';

@Injectable({ providedIn: 'root' })
export class VariantService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Variant[]>> {
    return this.api.get<ApiResponse<Variant[]>>('variants', params);
  }

  async getById(id: string): Promise<ApiResponse<Variant>> {
    return this.api.get<ApiResponse<Variant>>(`variants/${id}`, { includeInactive: true });
  }

  async create(payload: VariantPayload): Promise<ApiResponse<Variant>> {
    return this.api.post<ApiResponse<Variant>>('variants', payload);
  }

  async update(id: string, payload: Partial<VariantPayload>): Promise<ApiResponse<Variant>> {
    return this.api.patch<ApiResponse<Variant>>(`variants/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Variant>> {
    return this.api.patch<ApiResponse<Variant>>(`variants/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Variant>> {
    return this.api.delete<ApiResponse<Variant>>(`variants/${id}`);
  }
}
