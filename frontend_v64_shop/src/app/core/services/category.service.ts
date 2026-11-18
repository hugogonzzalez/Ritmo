import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Category, CategoryPayload } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Category[]>> {
    return this.api.get<ApiResponse<Category[]>>('categories', params);
  }

  async getById(id: string): Promise<ApiResponse<Category>> {
    return this.api.get<ApiResponse<Category>>(`categories/${id}`, { includeInactive: true });
  }

  async create(payload: CategoryPayload): Promise<ApiResponse<Category>> {
    return this.api.post<ApiResponse<Category>>('categories', payload);
  }

  async update(id: string, payload: Partial<CategoryPayload>): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`categories/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`categories/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Category>> {
    return this.api.delete<ApiResponse<Category>>(`categories/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Category>> {
    return this.api.patch<ApiResponse<Category>>(`categories/${id}/restore`, {});
  }

  async getBySlug(slug: string): Promise<ApiResponse<Category>> {
    return this.api.get<ApiResponse<Category>>(`categories/slug/${slug}`);
  }
}
