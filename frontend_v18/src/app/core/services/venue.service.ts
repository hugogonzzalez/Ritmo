import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Venue, VenuePayload, VenueStatus } from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly api = inject(ApiService);

  async listAdmin(): Promise<Venue[]> {
    return this.api.get<Venue[]>('venues', { includeInactive: true });
  }

  async getById(id: string): Promise<Venue> {
    return this.api.get<Venue>(`venues/${encodeURIComponent(id)}`, { includeInactive: true });
  }

  async create(payload: VenuePayload): Promise<Venue> {
    return this.api.post<Venue>('venues', payload);
  }

  async update(id: string, payload: Partial<VenuePayload>): Promise<Venue> {
    return this.api.put<Venue>(`venues/${encodeURIComponent(id)}`, payload);
  }

  async changeStatus(id: string, status: VenueStatus): Promise<Venue> {
    return this.api.patch<Venue>(`venues/${encodeURIComponent(id)}/status`, { status });
  }

  async setActive(id: string, active: boolean): Promise<Venue> {
    const action = active ? 'activate' : 'deactivate';
    return this.api.patch<Venue>(`venues/${encodeURIComponent(id)}/${action}`);
  }

  async softDelete(id: string): Promise<Venue> {
    return this.api.delete<Venue>(`venues/${encodeURIComponent(id)}`);
  }
}
