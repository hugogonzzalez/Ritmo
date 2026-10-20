import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ConcertImage, ImagePayload } from '../models/image.model';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly api = inject(ApiService);

  async listByConcert(concertId: string): Promise<ConcertImage[]> {
    return this.api.get<ConcertImage[]>('images', { concertId });
  }

  async listByPerformance(performanceId: string): Promise<ConcertImage[]> {
    return this.api.get<ConcertImage[]>('images', { performanceId });
  }

  async listByArtist(artistId: string): Promise<ConcertImage[]> {
    return this.api.get<ConcertImage[]>('images', { artistId });
  }

  async create(payload: ImagePayload): Promise<ConcertImage[]> {
    return this.api.post<ConcertImage[]>('images', payload);
  }

  async remove(id: string): Promise<void> {
    await this.api.delete<unknown>(`images/${encodeURIComponent(id)}`);
  }
}
