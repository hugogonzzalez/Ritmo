import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse, QueryParams } from '../models/api.model';
import { ConcertImage, ImagePayload } from '../models/image.model';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly api = inject(ApiService);

  // params: un único dueño, por ejemplo { concertId } o { venueId }
  async getAll(params: QueryParams): Promise<ApiResponse<ConcertImage[]>> {
    return this.api.get<ApiResponse<ConcertImage[]>>('images', params);
  }

  async create(payload: ImagePayload): Promise<ApiResponse<ConcertImage[]>> {
    return this.api.post<ApiResponse<ConcertImage[]>>('images', payload);
  }

  async softDelete(id: string): Promise<ApiResponse<ConcertImage>> {
    return this.api.delete<ApiResponse<ConcertImage>>(`images/${id}`);
  }
}
