import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ShopService } from '../../../../core/services/shop.service';
import { DEFAULT_SHOP_FILTERS, ShopStore } from '../../../../core/stores/shop.store';
import { ShopFilters, ShopConcert, ShopSort } from '../../../../core/models/shop.model';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { FilterBar } from '../../../../shared/components/filter-bar/filter-bar';
import { PriceRange, PriceRangeFilter } from '../../../../shared/components/price-range-filter/price-range-filter';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ConcertShopCard } from '../../components/concert-shop-card/concert-shop-card';

// Convierte un precio de la URL en número >= 0, o null si no es válido
const parseOptionalPrice = (value: string | null): number | null => {
  if (value === null || value === '') return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// Convierte el ?sort de la URL en una opción válida; si no es válida, orden por defecto
const SORT_VALUES: ShopSort[] = ['default', 'date_asc', 'price_asc', 'price_desc', 'title_asc'];
const parseSort = (value: string | null): ShopSort =>
  SORT_VALUES.includes(value as ShopSort) ? (value as ShopSort) : 'default';

@Component({
  selector: 'app-shop-list',
  standalone: true,
  imports: [SearchBar, FilterBar, PriceRangeFilter, Pagination, ConcertShopCard, SkeletonLoader, EmptyState, ErrorState],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Conciertos</h1>
        @if (store.pagination().total > 0) {
          <p class="text-sm text-gray-500 mt-1">{{ store.pagination().total }} resultado{{ store.pagination().total !== 1 ? 's' : '' }}</p>
        }
        @if (store.activeFilterCount() > 0) {
          <p class="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            {{ store.activeFilterCount() === 1 ? 'Tienes 1 filtro activo' : 'Tienes ' + store.activeFilterCount() + ' filtros activos' }}
          </p>
        }
      </div>

      <section class="mb-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <app-search-bar class="block" [value]="store.filters().search" (searchChange)="onSearch($event)" />

        <div class="flex flex-wrap items-center justify-between gap-3">
          <app-filter-bar
            class="block"
            [filters]="store.filters()"
            [categories]="store.categories()"
            [artists]="store.artists()"
            [venues]="store.venues()"
            [hasActiveFilters]="store.hasActiveFilters()"
            (filterChange)="onFilterChange($event)"
            (filtersReset)="onFiltersReset()"
          />

          <div class="flex flex-wrap items-center gap-3">
            <app-price-range-filter
              [minPrice]="store.filters().minPrice"
              [maxPrice]="store.filters().maxPrice"
              (rangeChange)="onPriceChange($event)"
            />
            <button type="button" (click)="onFiltersReset()" [disabled]="!store.hasActiveFilters()"
                    class="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018.4 9M18.4 9A7 7 0 005.6 15" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      @if (store.loading()) {
        <app-skeleton-loader />
      } @else if (store.error()) {
        <app-error-state [message]="store.error()!" (retry)="loadConcerts()" />
      } @else if (store.isEmpty()) {
        <app-empty-state title="No hay conciertos" message="Prueba a cambiar los filtros." />
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (concert of store.concerts(); track concert._id) {
            <app-concert-shop-card [concert]="concert" (selected)="onConcertSelect($event)" />
          }
        </div>

        <div class="mt-10">
          <app-pagination itemsLabel="conciertos" [pagination]="store.pagination()" (pageChange)="onPageChange($event)" />
        </div>
      }
    </div>
  `
})
export class ShopList implements OnInit, OnDestroy {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Cancela la petición anterior si el usuario cambia algo antes de que llegue
  private abortController: AbortController | null = null;

  ngOnInit(): void {
    if (this.store.categories().length === 0) {
      void this.loadCatalogue();
    }

    // Leer la URL: cada cambio de ?category, ?artist, ?venue, ?search o ?page recarga el listado
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.store.setFilters(this.filtersFromUrl(params));
        void this.loadConcerts();
      });
  }

  ngOnDestroy(): void {
    this.abortController?.abort();
  }

  async loadCatalogue(): Promise<void> {
    try {
      const [categories, artists, venues] = await Promise.all([
        this.shopService.getCategories(),
        this.shopService.getArtists(),
        this.shopService.getVenues()
      ]);
      this.store.setCatalogue(categories.data, artists.data, venues.data);
    } catch {
      // No es crítico: el listado funciona aunque no se vean los nombres de los filtros
    }
  }

  async loadConcerts(): Promise<void> {
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    this.store.setLoading(true);
    this.store.setError(null);

    try {
      const result = await this.shopService.getConcerts(this.store.filters(), controller.signal);
      this.store.setConcerts(result.data);
      this.store.setPagination(result.pagination);
    } catch (error) {
      if (controller.signal.aborted) return;
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar los conciertos.'));
    } finally {
      if (!controller.signal.aborted) this.store.setLoading(false);
    }
  }

  onSearch(search: string): void {
    this.store.setFilters({ search, page: 1 });
    this.syncUrl();
  }

  onFilterChange(patch: Partial<ShopFilters>): void {
    this.store.setFilters(patch);
    this.syncUrl();
  }

  onPriceChange(range: PriceRange): void {
    this.store.setFilters({ minPrice: range.minPrice, maxPrice: range.maxPrice, page: 1 });
    this.syncUrl();
  }

  onFiltersReset(): void {
    this.store.resetFilters();
    this.syncUrl();
  }

  onPageChange(page: number): void {
    this.store.setFilters({ page });
    this.syncUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onConcertSelect(concert: ShopConcert): void {
    void this.router.navigate(['/shop/concerts', concert.slug]);
  }

  // Lee los filtros de la URL. Lo que no esté en la URL vuelve al valor por defecto.
  private filtersFromUrl(params: ParamMap): ShopFilters {
    const page = Number(params.get('page'));
    return {
      ...DEFAULT_SHOP_FILTERS,
      categorySlug: params.get('category'),
      artistSlug: params.get('artist'),
      venueSlug: params.get('venue'),
      search: params.get('search') ?? '',
      minPrice: parseOptionalPrice(params.get('min_price')),
      maxPrice: parseOptionalPrice(params.get('max_price')),
      sort: parseSort(params.get('sort')),
      page: Number.isInteger(page) && page >= 1 ? page : 1
    };
  }

  // Escribe los filtros en la URL (sin añadir entradas al historial)
  private syncUrl(): void {
    const f = this.store.filters();
    const queryParams: Record<string, string | null> = {
      category: f.categorySlug,
      artist: f.artistSlug,
      venue: f.venueSlug,
      search: f.search || null,
      min_price: f.minPrice === null ? null : String(f.minPrice),
      max_price: f.maxPrice === null ? null : String(f.maxPrice),
      sort: f.sort === 'default' ? null : f.sort,
      page: f.page > 1 ? String(f.page) : null
    };
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
