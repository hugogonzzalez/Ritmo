import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { User, UserPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<User[]>> {
    return this.api.get<ApiResponse<User[]>>('users', params);
  }

  async getById(id: string): Promise<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(`users/${id}`, { includeInactive: true });
  }

  async getBySlug(slug: string): Promise<ApiResponse<User>> {
    return this.api.get<ApiResponse<User>>(`users/slug/${slug}`);
  }

  async create(payload: UserPayload): Promise<ApiResponse<User>> {
    return this.api.post<ApiResponse<User>>('users', payload);
  }

  async update(id: string, payload: Partial<UserPayload>): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`users/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`users/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<User>> {
    return this.api.delete<ApiResponse<User>>(`users/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<User>> {
    return this.api.patch<ApiResponse<User>>(`users/${id}/restore`, {});
  }
}
