import { Component, input, output } from '@angular/core';
import { ShopArtist, ShopCategory, ShopFilters, ShopSort, ShopVenue } from '../../../core/models/shop.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative" [style.min-width]="compact() ? '8.5rem' : '11rem'">
        <select [value]="filters().categorySlug ?? ''" (change)="onChange('categorySlug', $event)"
                class="select-control" [class.compact]="compact()">
          <option value="">Todas las categorías</option>
          @for (category of categories(); track category._id) {
            <option [value]="category.slug">{{ category.name }}</option>
          }
        </select>
        <svg class="select-chevron" [class.compact]="compact()" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </div>

      <div class="relative" [style.min-width]="compact() ? '8.5rem' : '11rem'">
        <select [value]="filters().artistSlug ?? ''" (change)="onChange('artistSlug', $event)"
                class="select-control" [class.compact]="compact()">
          <option value="">Todos los artistas</option>
          @for (artist of artists(); track artist._id) {
            <option [value]="artist.slug">{{ artist.name }}</option>
          }
        </select>
        <svg class="select-chevron" [class.compact]="compact()" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </div>

      <div class="relative" [style.min-width]="compact() ? '8.5rem' : '11rem'">
        <select [value]="filters().venueSlug ?? ''" (change)="onChange('venueSlug', $event)"
                class="select-control" [class.compact]="compact()">
          <option value="">Todas las salas</option>
          @for (venue of venues(); track venue._id) {
            <option [value]="venue.slug">{{ venue.name }} ({{ venue.city }})</option>
          }
        </select>
        <svg class="select-chevron" [class.compact]="compact()" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </div>

      <div class="relative" [style.min-width]="compact() ? '8.5rem' : '11rem'">
        <select [value]="filters().sort" (change)="onSortChange($event)"
                class="select-control" [class.compact]="compact()" aria-label="Ordenar por">
          <option value="default">Orden por defecto</option>
          <option value="date_asc">Fecha más cercana</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="title_asc">Nombre: de la A a la Z</option>
        </select>
        <svg class="select-chevron" [class.compact]="compact()" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  `,
  styles: `
    .select-control {
      height: 2.75rem;
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      padding: 0 2.5rem 0 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
      cursor: pointer;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .select-control:hover { border-color: #d1d5db; }
    .select-control:focus { outline: none; border-color: transparent; box-shadow: 0 0 0 2px #3b82f6; }
    .select-control.compact {
      height: 2rem;
      font-size: 0.75rem;
      padding: 0 1.75rem 0 0.75rem;
      border-radius: 0.6rem;
    }
    .select-chevron.compact {
      width: 0.9rem;
      height: 0.9rem;
      right: 0.7rem;
    }
    .select-chevron {
      position: absolute;
      right: 0.9rem;
      top: 50%;
      width: 1.1rem;
      height: 1.1rem;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }
  `
})
export class FilterBar {
  readonly filters = input.required<ShopFilters>();
  readonly categories = input<ShopCategory[]>([]);
  readonly artists = input<ShopArtist[]>([]);
  readonly venues = input<ShopVenue[]>([]);
  readonly hasActiveFilters = input<boolean>(false);
  // Versión más pequeña (la usa el panel de admin)
  readonly compact = input<boolean>(false);

  readonly filterChange = output<Partial<ShopFilters>>();
  readonly filtersReset = output<void>();

  onChange(key: 'categorySlug' | 'artistSlug' | 'venueSlug', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterChange.emit({ [key]: value || null, page: 1 } as Partial<ShopFilters>);
  }

  onSortChange(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value as ShopSort;
    this.filterChange.emit({ sort, page: 1 });
  }
}
