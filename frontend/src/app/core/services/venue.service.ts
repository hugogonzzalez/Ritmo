import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { Venue, VenuePayload, VenueStatus } from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly api = inject(ApiService);

  async getAll(params?: QueryParams): Promise<ApiResponse<Venue[]>> {
    return this.api.get<ApiResponse<Venue[]>>('venues', params);
  }

  async getById(id: string): Promise<ApiResponse<Venue>> {
    return this.api.get<ApiResponse<Venue>>(`venues/${id}`, { includeInactive: true });
  }

  async create(payload: VenuePayload): Promise<ApiResponse<Venue>> {
    return this.api.post<ApiResponse<Venue>>('venues', payload);
  }

  async update(id: string, payload: Partial<VenuePayload>): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`venues/${id}`, payload);
  }

  async changeStatus(id: string, status: VenueStatus): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`venues/${id}/status`, { status });
  }

  async setActivation(id: string, isActive: boolean): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`venues/${id}/activation`, { isActive });
  }

  async softDelete(id: string): Promise<ApiResponse<Venue>> {
    return this.api.delete<ApiResponse<Venue>>(`venues/${id}`);
  }

  async restoreDelete(id: string): Promise<ApiResponse<Venue>> {
    return this.api.patch<ApiResponse<Venue>>(`venues/${id}/restore`, {});
  }

  async getBySlug(slug: string): Promise<ApiResponse<Venue>> {
    return this.api.get<ApiResponse<Venue>>(`venues/slug/${slug}`);
  }
}
