import { Injectable, computed, signal } from '@angular/core';
import {
  ShopArtist,
  ShopCategory,
  ShopConcert,
  ShopFilters,
  ShopPagination,
  ShopPerformance,
  ShopVenue
} from '../models/shop.model';

export const DEFAULT_SHOP_FILTERS: ShopFilters = {
  categorySlug: null,
  artistSlug: null,
  venueSlug: null,
  search: '',
  minPrice: null,
  maxPrice: null,
  sort: 'default',
  page: 1,
  limit: 6
};

@Injectable({ providedIn: 'root' })
export class ShopStore {
  // ── Catálogo para filtros y portada ───────────────────────────────────────
  private readonly _categories = signal<ShopCategory[]>([]);
  private readonly _artists = signal<ShopArtist[]>([]);
  private readonly _venues = signal<ShopVenue[]>([]);
  private readonly _catalogueLoading = signal(false);
  private readonly _catalogueError = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly artists = this._artists.asReadonly();
  readonly venues = this._venues.asReadonly();
  readonly catalogueLoading = this._catalogueLoading.asReadonly();
  readonly catalogueError = this._catalogueError.asReadonly();

  // ── Listado de conciertos ─────────────────────────────────────────────────
  private readonly _filters = signal<ShopFilters>({ ...DEFAULT_SHOP_FILTERS });
  private readonly _concerts = signal<ShopConcert[]>([]);
  private readonly _pagination = signal<ShopPagination>({ total: 0, page: 1, limit: 6, totalPages: 0 });
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly filters = this._filters.asReadonly();
  readonly concerts = this._concerts.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isEmpty = computed(() => !this._loading() && this._concerts().length === 0);
  readonly hasActiveFilters = computed(() => {
    const f = this._filters();
    return !!(f.categorySlug || f.artistSlug || f.venueSlug || f.search || f.minPrice !== null || f.maxPrice !== null || f.sort !== 'default');
  });
  // Cuántos filtros están activos. El precio cuenta como uno (aunque tenga mínimo y máximo),
  // y el orden no cuenta porque no filtra, solo ordena.
  readonly activeFilterCount = computed(() => {
    const f = this._filters();
    const active = [
      !!f.categorySlug,
      !!f.artistSlug,
      !!f.venueSlug,
      !!f.search.trim(),
      f.minPrice !== null || f.maxPrice !== null
    ];
    return active.filter(Boolean).length;
  });

  // ── Detalle de un concierto ───────────────────────────────────────────────
  private readonly _selectedConcert = signal<ShopConcert | null>(null);
  private readonly _performances = signal<ShopPerformance[]>([]);
  private readonly _detailLoading = signal(false);
  private readonly _detailError = signal<string | null>(null);

  readonly selectedConcert = this._selectedConcert.asReadonly();
  readonly performances = this._performances.asReadonly();
  readonly detailLoading = this._detailLoading.asReadonly();
  readonly detailError = this._detailError.asReadonly();

  // ── Cambios ───────────────────────────────────────────────────────────────
  setCatalogue(categories: ShopCategory[], artists: ShopArtist[], venues: ShopVenue[]): void {
    this._categories.set(categories);
    this._artists.set(artists);
    this._venues.set(venues);
  }
  setCatalogueLoading(value: boolean): void { this._catalogueLoading.set(value); }
  setCatalogueError(message: string | null): void { this._catalogueError.set(message); }

  setFilters(patch: Partial<ShopFilters>): void {
    this._filters.update(f => ({ ...f, ...patch }));
  }
  resetFilters(): void {
    this._filters.set({ ...DEFAULT_SHOP_FILTERS });
  }

  setConcerts(list: ShopConcert[]): void { this._concerts.set(list); }
  setPagination(pagination: ShopPagination): void { this._pagination.set(pagination); }
  setLoading(value: boolean): void { this._loading.set(value); }
  setError(message: string | null): void { this._error.set(message); }

  setSelectedConcert(concert: ShopConcert | null): void { this._selectedConcert.set(concert); }
  setPerformances(list: ShopPerformance[]): void { this._performances.set(list); }
  setDetailLoading(value: boolean): void { this._detailLoading.set(value); }
  setDetailError(message: string | null): void { this._detailError.set(message); }
}
