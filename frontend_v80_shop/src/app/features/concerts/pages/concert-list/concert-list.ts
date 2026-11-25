import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { SearchBar } from '../../../../shared/components/search-bar/search-bar';
import { FilterBar } from '../../../../shared/components/filter-bar/filter-bar';
import { PriceRange, PriceRangeFilter } from '../../../../shared/components/price-range-filter/price-range-filter';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { LucidePlus, LucideTicket } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { Concert } from '../../../../core/models/concert.model';
import { ShopArtist, ShopCategory, ShopFilters, ShopPagination, ShopVenue } from '../../../../core/models/shop.model';
import { ConcertGrid } from '../../components/concert-grid/concert-grid';
import { ConcertService } from '../../../../core/services/concert.service';
import { ShopService } from '../../../../core/services/shop.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { QueryParams } from '../../../../core/models/api.model';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { DEFAULT_SHOP_FILTERS } from '../../../../core/stores/shop.store';

@Component({
  selector: 'app-concert-list',
  standalone: true,
  imports: [RouterLink, SkeletonLoader, ErrorState, ConcertGrid, LucidePlus, LucideTicket, SearchBar, FilterBar, PriceRangeFilter, Pagination],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">CATÁLOGO</p><h1>Conciertos</h1><p class="heading-copy">Consulta y gestiona los conciertos de Ritmo.</p></div>
        <a class="primary-action" routerLink="/concerts/create"><svg lucidePlus [size]="17"></svg> Nuevo concierto</a>
      </div>
      <section class="mb-4 space-y-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <app-search-bar class="block" [compact]="true" [value]="filters().search" (searchChange)="onSearch($event)" />

        <div class="flex flex-wrap items-center justify-between gap-2">
          <app-filter-bar
            class="block"
            [compact]="true"
            [filters]="filters()"
            [categories]="categories()"
            [artists]="artists()"
            [venues]="venues()"
            (filterChange)="onFilterChange($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
            <app-price-range-filter
              [compact]="true"
              [minPrice]="filters().minPrice"
              [maxPrice]="filters().maxPrice"
              (rangeChange)="onPriceChange($event)"
            />
            <button type="button" (click)="onReset()" [disabled]="!hasActiveFilters()"
                    class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018.4 9M18.4 9A7 7 0 005.6 15" />
              </svg>
              Limpiar filtros
            </button>
          </div>
        </div>

        @if (activeFilterCount() > 0) {
          <p class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <span class="h-2 w-2 rounded-full bg-blue-600"></span>
            {{ activeFilterCount() === 1 ? 'Tienes 1 filtro activo' : 'Tienes ' + activeFilterCount() + ' filtros activos' }}
          </p>
        }
      </section>

      <section class="table-panel">
        @if (store.error()) { <app-error-state [message]="store.error() ?? ''" (retry)="load()" /> }
        @if (store.loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="6" /></div>
        } @else if (store.concerts().length === 0) {
          <div class="table-empty"><span class="empty-icon"><svg lucideTicket [size]="23"></svg></span><strong>{{ activeFilterCount() > 0 ? 'No hay conciertos con estos filtros' : 'Aún no hay conciertos' }}</strong><p>{{ activeFilterCount() > 0 ? 'Prueba a quitar alguno.' : 'Crea el primer concierto para empezar.' }}</p><a class="primary-action" routerLink="/concerts/create"><svg lucidePlus [size]="16"></svg> Crear concierto</a></div>
        } @else {
          <app-concert-grid [concerts]="store.concerts()" [busy]="store.saving()" (toggleActive)="toggle($event)" (deleteConcert)="remove($event)" />
        }
      </section>

      @if (pagination() && store.concerts().length > 0) {
        <div class="mt-6">
          <app-pagination itemsLabel="conciertos" [pagination]="pagination()!" (pageChange)="onPageChange($event)" />
        </div>
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1500px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.primary-action{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;background:#0878f9;padding:11px 15px;color:white;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 6px 15px #0878f926}.primary-action:hover{background:#0669dc}.concert-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.concert-metrics>div{display:flex;justify-content:space-between;align-items:center;border:1px solid #e7ebf1;border-radius:11px;background:#fff;padding:12px 16px}.concert-metrics span{color:#718096;font-size:11px}.concert-metrics strong{color:#172033;font:700 18px 'Space Grotesk',sans-serif}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.table-scroll{overflow:auto}.concert-table{width:100%;min-width:890px;border-collapse:collapse;text-align:left}.concert-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;letter-spacing:.15px;white-space:nowrap}.concert-table th,.concert-table td{padding:0 14px}.concert-table tbody tr{height:63px;border-top:1px solid #edf0f4}.concert-table tbody tr:hover{background:#fbfcfe}.concert-table td{color:#4b5668;font-size:11px}.concert-cell{display:flex;align-items:center;gap:10px;min-width:178px}.concert-avatar{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:10px;background:#eaf3ff;color:#0878f9}.concert-cell>span:last-child{min-width:0;display:grid;gap:4px}.concert-cell strong{max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#293345;font-size:11px}.concert-cell small{max-width:185px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9aa3b1;font-size:9px}.cell-with-icon{display:flex;align-items:center;gap:7px;white-space:nowrap;color:#667286}.cell-with-icon svg{flex:0 0 auto;color:#98a2b2}.price-cell{font-weight:700;white-space:nowrap}.status-pill{display:inline-flex;border-radius:99px;background:#e7f2ff;padding:5px 9px;color:#1769bd;font-size:9px;font-weight:700;white-space:nowrap}.status-full{background:#fff3df;color:#aa6c0c}.status-cancelled{background:#ffeded;color:#bd3f43}.status-completed{background:#edf0f4;color:#677386}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:30px;height:30px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.power-off:hover{border-color:#f0d3a8;background:#fff8eb;color:#ac6a0d}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.table-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-foot span{color:#9ca5b1}.skeleton-rows{padding:16px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}.table-error{padding:11px 16px;background:#fff2f2;color:#a53c3c;font-size:11px}.table-error button{margin-left:8px;border:0;background:none;color:#0878f9;font-weight:700;cursor:pointer}@media(max-width:850px){.admin-content{padding:25px 18px 40px}.concert-metrics{grid-template-columns:repeat(2,1fr)}.table-foot{flex-direction:column;gap:4px}}@media(max-width:520px){.admin-page-heading{align-items:flex-start;gap:9px}.admin-page-heading h1{font-size:25px}.primary-action{padding:10px;font-size:10px}.concert-metrics>div{padding:11px}.concert-metrics span{font-size:10px}}`]
})
export class ConcertList implements OnInit {
  readonly store = inject(ConcertsStore);
  private readonly concertService = inject(ConcertService);
  private readonly alerts = inject(AlertService);
  private readonly shopService = inject(ShopService);

  // Filtros del panel: los mismos que en la tienda. El orden inicial es A-Z, como antes.
  readonly defaultFilters: ShopFilters = { ...DEFAULT_SHOP_FILTERS, sort: 'title_asc', limit: 10 };
  readonly filters = signal<ShopFilters>({ ...this.defaultFilters });

  readonly categories = signal<ShopCategory[]>([]);
  readonly artists = signal<ShopArtist[]>([]);
  readonly venues = signal<ShopVenue[]>([]);
  readonly pagination = signal<ShopPagination | null>(null);

  // Cuántos filtros están activos (el orden no cuenta: solo ordena). El precio cuenta como uno.
  readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return [
      !!f.categorySlug,
      !!f.artistSlug,
      !!f.venueSlug,
      !!f.search.trim(),
      f.minPrice !== null || f.maxPrice !== null
    ].filter(Boolean).length;
  });
  readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0 || this.filters().sort !== this.defaultFilters.sort);

  ngOnInit(): void {
    void this.loadCatalogue();
    void this.load();
  }

  async loadCatalogue(): Promise<void> {
    try {
      const [categories, artists, venues] = await Promise.all([
        this.shopService.getCategories(),
        this.shopService.getArtists(),
        this.shopService.getVenues()
      ]);
      this.categories.set(categories.data);
      this.artists.set(artists.data);
      this.venues.set(venues.data);
    } catch {
      // No es crítico: el listado funciona aunque no se vean los nombres de los filtros
    }
  }

  onSearch(search: string): void {
    this.applyFilters({ search, page: 1 });
  }

  onFilterChange(patch: Partial<ShopFilters>): void {
    this.applyFilters({ ...patch, page: 1 });
  }

  onPriceChange(range: PriceRange): void {
    this.applyFilters({ minPrice: range.minPrice, maxPrice: range.maxPrice, page: 1 });
  }

  onPageChange(page: number): void {
    this.applyFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onReset(): void {
    this.filters.set({ ...this.defaultFilters });
    void this.load();
  }

  private applyFilters(patch: Partial<ShopFilters>): void {
    this.filters.update(f => ({ ...f, ...patch }));
    void this.load();
  }

  // Convierte los filtros en parámetros de la URL: solo se envían los que tienen valor
  private buildParams(): QueryParams {
    const f = this.filters();
    const params: QueryParams = { includeInactive: true, page: f.page, limit: f.limit };
    if (f.categorySlug) params['category_slug'] = f.categorySlug;
    if (f.artistSlug) params['artist_slug'] = f.artistSlug;
    if (f.venueSlug) params['venue_slug'] = f.venueSlug;
    if (f.search.trim()) params['search'] = f.search.trim();
    if (f.minPrice !== null) params['min_price'] = f.minPrice;
    if (f.maxPrice !== null) params['max_price'] = f.maxPrice;
    if (f.sort !== 'default') params['sort'] = f.sort;
    return params;
  }

  async load(): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    try {
      const response = await this.concertService.getAll(this.buildParams());
      this.store.setItems(response.data);
      this.pagination.set(response.pagination ?? null);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar los conciertos.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async toggle(concert: Concert): Promise<void> {
    const active = !concert.isActive;
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.concertService.setActivation(concert._id, active);
      this.store.upsert(response.data);
      await this.alerts.success(active ? 'Concierto activado' : 'Concierto desactivado', concert.title);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  async remove(concert: Concert): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar concierto?', `«${concert.title}» desaparecerá de la tabla.`, 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      await this.concertService.softDelete(concert._id);
      this.store.remove(concert._id);
      await this.alerts.success('Concierto eliminado', 'Se ha eliminado de la lista de administración.');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se pudo eliminar el concierto.'));
    } finally {
      this.store.setSaving(false);
    }
  }
}
