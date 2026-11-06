import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Role, RolePayload } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Role[]>> {
    return this.api.get<ApiResponse<Role[]>>('roles', params);
  }

  async getById(id: string): Promise<ApiResponse<Role>> {
    return this.api.get<ApiResponse<Role>>(`roles/${id}`, { includeInactive: true });
  }

  async getBySlug(slug: string): Promise<ApiResponse<Role>> {
    return this.api.get<ApiResponse<Role>>(`roles/slug/${slug}`);
  }

  async create(payload: RolePayload): Promise<ApiResponse<Role>> {
    return this.api.post<ApiResponse<Role>>('roles', payload);
  }

  async update(id: string, payload: Partial<RolePayload>): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`roles/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`roles/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Role>> {
    return this.api.delete<ApiResponse<Role>>(`roles/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Role>> {
    return this.api.patch<ApiResponse<Role>>(`roles/${id}/restore`, {});
  }
}
