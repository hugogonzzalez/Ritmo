import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '../models/api.model';
import { AdminComment, SentimientoConcierto, VariantComment, VariantCommentInput, VariantComments } from '../models/comment.model';
import { ShopPagination } from '../models/shop.model';
import { ApiService } from './api.service';

// Filtros del dashboard de valoraciones (admin)
export interface AdminCommentFilters {
  q: string;
  concertId: string;
  rating: number | null;
  sort: 'desc' | 'asc';
}

// Comentarios y valoraciones de las variantes (lectura pública; escribir requiere sesión)
@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly api = inject(ApiService);

  listByVariant(variantId: string): Promise<ApiResponse<VariantComments>> {
    return this.api.get<ApiResponse<VariantComments>>(`comments/variant/${variantId}`);
  }

  create(variantId: string, datos: VariantCommentInput): Promise<ApiResponse<VariantComment>> {
    return this.api.post<ApiResponse<VariantComment>>(`comments/variant/${variantId}`, datos);
  }

  update(id: string, datos: Partial<VariantCommentInput>): Promise<ApiResponse<VariantComment>> {
    return this.api.put<ApiResponse<VariantComment>>(`comments/${id}`, datos);
  }

  // Dashboard del admin: valoraciones paginadas y filtradas
  listForAdmin(page: number, filtros: AdminCommentFilters): Promise<{ data: AdminComment[]; pagination: ShopPagination }> {
    const params = new URLSearchParams({ page: String(page), limit: '20', sort: filtros.sort });
    if (filtros.q) params.set('q', filtros.q);
    if (filtros.concertId) params.set('concertId', filtros.concertId);
    if (filtros.rating) params.set('rating', String(filtros.rating));
    return this.api.get<{ data: AdminComment[]; pagination: ShopPagination }>(`comments/admin?${params.toString()}`);
  }

  // Dashboard del admin: positivas, neutras y negativas por concierto
  sentimientoPorConcierto(): Promise<ApiResponse<SentimientoConcierto[]>> {
    return this.api.get<ApiResponse<SentimientoConcierto[]>>('comments/admin/sentimiento');
  }

  remove(id: string): Promise<ApiResponse<unknown>> {
    return this.api.delete<ApiResponse<unknown>>(`comments/${id}`);
  }
}
