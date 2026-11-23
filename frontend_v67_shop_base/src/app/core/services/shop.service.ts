import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse, QueryParams } from '../models/api.model';
import { ApiService } from './api.service';
import {
  ShopArtist,
  ShopCategory,
  ShopConcert,
  ShopConcertsResponse,
  ShopFilters,
  ShopPerformance,
  ShopVariant,
  ShopVenue
} from '../models/shop.model';

// Algunos conciertos antiguos no tienen estos campos en la base de datos.
// Se rellenan aquí para que las plantillas nunca lean `undefined`.
const normalizeConcert = (concert: ShopConcert): ShopConcert => ({
  ...concert,
  images: concert.images ?? [],
  artists: concert.artists ?? [],
  categories: concert.categories ?? []
});

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly api = inject(ApiService);

  async getCategories(): Promise<ApiResponse<ShopCategory[]>> {
    return this.api.get<ApiResponse<ShopCategory[]>>('shop/categories');
  }

  async getArtists(): Promise<ApiResponse<ShopArtist[]>> {
    return this.api.get<ApiResponse<ShopArtist[]>>('shop/artists');
  }

  async getVenues(): Promise<ApiResponse<ShopVenue[]>> {
    return this.api.get<ApiResponse<ShopVenue[]>>('shop/venues');
  }

  // Precio más barato y más caro de las sesiones próximas; data es null si no hay ninguna
  async getPriceRange(): Promise<ApiResponse<{ min: number; max: number } | null>> {
    return this.api.get<ApiResponse<{ min: number; max: number } | null>>('shop/price-range');
  }

  // Listado paginado. Usa fetch para poder cancelar la petición con AbortSignal.
  async getConcerts(filters: Partial<ShopFilters>, signal?: AbortSignal): Promise<ShopConcertsResponse> {
    const params: QueryParams = {};
    if (filters.categorySlug) params['category_slug'] = filters.categorySlug;
    if (filters.artistSlug) params['artist_slug'] = filters.artistSlug;
    if (filters.venueSlug) params['venue_slug'] = filters.venueSlug;
    if (filters.search?.trim()) params['search'] = filters.search.trim();
    if (filters.minPrice != null) params['min_price'] = filters.minPrice;
    if (filters.maxPrice != null) params['max_price'] = filters.maxPrice;
    if (filters.sort && filters.sort !== 'default') params['sort'] = filters.sort;
    if (filters.page) params['page'] = filters.page;
    if (filters.limit) params['limit'] = filters.limit;

    const response = await fetch(this.buildUrl('shop/concerts', params), { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const body = (await response.json()) as ShopConcertsResponse;
    return { ...body, data: (body.data ?? []).map(normalizeConcert) };
  }

  async getConcertBySlug(slug: string): Promise<ApiResponse<ShopConcert>> {
    const response = await this.api.get<ApiResponse<ShopConcert>>(`shop/concerts/${slug}`);
    return { ...response, data: normalizeConcert(response.data) };
  }

  async getPerformancesBySlug(slug: string): Promise<ApiResponse<ShopPerformance[]>> {
    return this.api.get<ApiResponse<ShopPerformance[]>>(`shop/concerts/${slug}/performances`);
  }

  async getVariantsByPerformanceSlug(performanceSlug: string): Promise<ApiResponse<ShopVariant[]>> {
    return this.api.get<ApiResponse<ShopVariant[]>>(`shop/performances/${performanceSlug}/variants`);
  }

  // Construye la URL con los parámetros que tengan valor
  private buildUrl(endpoint: string, params: QueryParams = {}): string {
    const base = environment.apiUrl.replace(/\/$/, '');
    const url = new URL(`${base}/${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}
