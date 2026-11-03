import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '../models/api.model';
import { AdminProfile, Profile, ProfilePayload } from '../models/profile.model';
import { ApiService } from './api.service';

// Perfil del usuario autenticado (/api/profiles/me)
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  async getMe(): Promise<ApiResponse<Profile>> {
    return this.api.get<ApiResponse<Profile>>('profiles/me');
  }

  // Todos los perfiles (solo administradores)
  async getAll(): Promise<ApiResponse<AdminProfile[]>> {
    return this.api.get<ApiResponse<AdminProfile[]>>('profiles');
  }

  async updateMe(payload: ProfilePayload): Promise<ApiResponse<Profile>> {
    return this.api.patch<ApiResponse<Profile>>('profiles/me', payload);
  }
}
