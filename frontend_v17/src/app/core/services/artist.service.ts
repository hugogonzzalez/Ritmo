import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Artist, ArtistPayload } from '../models/artist.model';

@Injectable({ providedIn: 'root' })
export class ArtistService {
  private readonly api = inject(ApiService);

  async listAdmin(): Promise<Artist[]> {
    return this.api.get<Artist[]>('artists', { includeInactive: true });
  }

  async getById(id: string): Promise<Artist> {
    return this.api.get<Artist>(`artists/${encodeURIComponent(id)}`, { includeInactive: true });
  }

  async create(payload: ArtistPayload): Promise<Artist> {
    return this.api.post<Artist>('artists', payload);
  }

  async update(id: string, payload: Partial<ArtistPayload>): Promise<Artist> {
    return this.api.put<Artist>(`artists/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, active: boolean): Promise<Artist> {
    const action = active ? 'activate' : 'deactivate';
    return this.api.patch<Artist>(`artists/${encodeURIComponent(id)}/${action}`);
  }

  async softDelete(id: string): Promise<Artist> {
    return this.api.delete<Artist>(`artists/${encodeURIComponent(id)}`);
  }
}
