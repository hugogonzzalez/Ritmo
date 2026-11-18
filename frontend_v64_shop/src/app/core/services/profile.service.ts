import { Injectable, inject } from '@angular/core';
import { ApiResponse, QueryParams } from '../models/api.model';
import { AdminProfile, Profile, ProfilePayload } from '../models/profile.model';
import { ApiService } from './api.service';

// Perfiles: el propio usuario (/api/profiles/me) y, para administradores, cualquier perfil (/api/profiles/:userId)
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  async getMe(): Promise<ApiResponse<Profile>> {
    return this.api.get<ApiResponse<Profile>>('profiles/me');
  }

  // Todos los perfiles (solo administradores). Con parámetros de listado el backend devuelve paginación.
  async getAll(params?: QueryParams): Promise<ApiResponse<AdminProfile[]>> {
    return this.api.get<ApiResponse<AdminProfile[]>>('profiles', params);
  }

  // Perfil de un usuario concreto (el propio o cualquiera si eres administrador)
  async getByUserId(userId: string): Promise<ApiResponse<Profile>> {
    return this.api.get<ApiResponse<Profile>>(`profiles/${userId}`);
  }

  async updateMe(payload: ProfilePayload): Promise<ApiResponse<Profile>> {
    return this.api.patch<ApiResponse<Profile>>('profiles/me', payload);
  }

  // Editar el perfil de otro usuario (solo administradores)
  async updateByUserId(userId: string, payload: ProfilePayload): Promise<ApiResponse<Profile>> {
    return this.api.patch<ApiResponse<Profile>>(`profiles/${userId}`, payload);
  }
}
