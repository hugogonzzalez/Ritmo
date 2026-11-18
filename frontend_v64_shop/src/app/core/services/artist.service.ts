import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Artist, ArtistPayload } from '../models/artist.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Artist[]>> {
    return this.api.get<ApiResponse<Artist[]>>('artists', params);
  }

  async getById(id: string): Promise<ApiResponse<Artist>> {
    return this.api.get<ApiResponse<Artist>>(`artists/${id}`, { includeInactive: true });
  }

  async create(payload: ArtistPayload): Promise<ApiResponse<Artist>> {
    return this.api.post<ApiResponse<Artist>>('artists', payload);
  }

  async update(id: string, payload: Partial<ArtistPayload>): Promise<ApiResponse<Artist>> {
    return this.api.patch<ApiResponse<Artist>>(`artists/${id}`, payload);
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Artist>> {
    return this.api.patch<ApiResponse<Artist>>(`artists/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Artist>> {
    return this.api.delete<ApiResponse<Artist>>(`artists/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Artist>> {
    return this.api.patch<ApiResponse<Artist>>(`artists/${id}/restore`, {});
  }

  async getBySlug(slug: string): Promise<ApiResponse<Artist>> {
    return this.api.get<ApiResponse<Artist>>(`artists/slug/${slug}`);
  }
}
