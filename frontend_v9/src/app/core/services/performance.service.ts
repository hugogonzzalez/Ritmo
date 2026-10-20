import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Performance, PerformancePayload } from '../models/performance.model';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly api = inject(ApiService);

  async listAdmin(concertId?: string): Promise<Performance[]> {
    const params: Record<string, string | boolean> = { includeInactive: true };
    if (concertId) params['concertId'] = concertId;
    return this.api.get<Performance[]>('performances', params);
  }

  async getById(id: string): Promise<Performance> {
    return this.api.get<Performance>(`performances/${encodeURIComponent(id)}`, { includeInactive: true });
  }

  async create(payload: PerformancePayload): Promise<Performance> {
    return this.api.post<Performance>('performances', payload);
  }

  async update(id: string, payload: Partial<PerformancePayload>): Promise<Performance> {
    return this.api.put<Performance>(`performances/${encodeURIComponent(id)}`, payload);
  }

  async setActive(id: string, active: boolean): Promise<Performance> {
    const action = active ? 'activate' : 'deactivate';
    return this.api.patch<Performance>(`performances/${encodeURIComponent(id)}/${action}`);
  }

  async softDelete(id: string): Promise<Performance> {
    return this.api.delete<Performance>(`performances/${encodeURIComponent(id)}`);
  }
}
