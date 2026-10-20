import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Concert, ConcertDraft, ConcertPayload } from '../models/concert.model';

@Injectable({ providedIn: 'root' })
export class ConcertService {
  private readonly api = inject(ApiService);

  async listAdmin(): Promise<Concert[]> {
    return this.api.get<Concert[]>('concerts', { includeInactive: true });
  }

  async list(): Promise<Concert[]> {
    return this.api.get<Concert[]>('concerts');
  }

  async getById(id: string): Promise<Concert> {
    return this.api.get<Concert>(`concerts/${encodeURIComponent(id)}`, { includeInactive: true });
  }

  async create(payload: ConcertDraft): Promise<Concert> {
    return this.api.post<Concert>('concerts', payload);
  }

  async update(id: string, payload: Partial<ConcertPayload>): Promise<Concert> {
    return this.api.put<Concert>(`concerts/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, active: boolean): Promise<Concert> {
    const action = active ? 'activate' : 'deactivate';
    return this.api.patch<Concert>(`concerts/${encodeURIComponent(id)}/${action}`);
  }

  async softDelete(id: string): Promise<Concert> {
    return this.api.delete<Concert>(`concerts/${encodeURIComponent(id)}`);
  }

  async remove(id: string): Promise<void> {
    await this.softDelete(id);
  }
}
