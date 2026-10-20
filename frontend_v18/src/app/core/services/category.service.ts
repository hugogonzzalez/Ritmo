import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Category, CategoryPayload } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  async listAdmin(): Promise<Category[]> {
    return this.api.get<Category[]>('categories', { includeInactive: true });
  }

  async getById(id: string): Promise<Category> {
    return this.api.get<Category>(`categories/${encodeURIComponent(id)}`, { includeInactive: true });
  }

  async create(payload: CategoryPayload): Promise<Category> {
    return this.api.post<Category>('categories', payload);
  }

  async update(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
    return this.api.put<Category>(`categories/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, active: boolean): Promise<Category> {
    const action = active ? 'activate' : 'deactivate';
    return this.api.patch<Category>(`categories/${encodeURIComponent(id)}/${action}`);
  }

  async softDelete(id: string): Promise<Category> {
    return this.api.delete<Category>(`categories/${encodeURIComponent(id)}`);
  }
}
