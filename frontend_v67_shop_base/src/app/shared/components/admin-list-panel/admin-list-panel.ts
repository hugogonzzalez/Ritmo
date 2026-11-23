import { Component, computed, input, output } from '@angular/core';
import { AdminDateField, AdminFilterValues, AdminSelectDef } from '../../../core/models/admin-list.model';
import { SearchBar } from '../search-bar/search-bar';
import { PriceRange, PriceRangeFilter } from '../price-range-filter/price-range-filter';

// Panel de filtros reutilizable para las pantallas del admin.
// Cada pantalla decide sus desplegables, fechas y precio; el panel solo los muestra y avisa de los cambios.
@Component({
  selector: 'app-admin-list-panel',
  standalone: true,
  imports: [SearchBar, PriceRangeFilter],
  template: `
    <section class="mb-4 space-y-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <app-search-bar class="block" [compact]="true" [placeholder]="searchPlaceholder()"
                      [value]="values()['search'] ?? ''" (searchChange)="onSearch($event)" />

      <div class="flex flex-wrap items-center gap-2">
        @for (select of selects(); track select.key) {
          <div class="relative min-w-[8.5rem]">
            <select class="select-control" [attr.aria-label]="select.label"
                    [value]="values()[select.key] ?? ''" (change)="onSelect(select.key, $event)">
              @for (option of select.options; track option.value) {
                <option [value]="option.value">{{ select.label }}: {{ option.label }}</option>
              }
            </select>
            <svg class="select-chevron" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </div>
        }

        @for (field of dateFields(); track field.key) {
          <label class="date-field">
            <span>{{ field.label }}</span>
            <input type="date" [value]="values()[field.key] ?? ''" (change)="onDate(field.key, $event)" />
          </label>
        }

        @if (showPrice()) {
          <app-price-range-filter [compact]="true"
                                  [minPrice]="toNumber(values()['min_price'])"
                                  [maxPrice]="toNumber(values()['max_price'])"
                                  (rangeChange)="onPrice($event)" />
        }

        <button type="button" (click)="resetFilters.emit()" [disabled]="!isDirty()"
                class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018.4 9M18.4 9A7 7 0 005.6 15" />
          </svg>
          Limpiar filtros
        </button>
      </div>

      @if (activeCount() > 0) {
        <p class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          <span class="h-2 w-2 rounded-full bg-blue-600"></span>
          {{ activeCount() === 1 ? 'Tienes 1 filtro activo' : 'Tienes ' + activeCount() + ' filtros activos' }}
        </p>
      }
    </section>
  `,
  styles: `
    .select-control {
      height: 2rem;
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      border-radius: 0.6rem;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      padding: 0 1.75rem 0 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
      cursor: pointer;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .select-control:hover { border-color: #d1d5db; }
    .select-control:focus { outline: none; border-color: transparent; box-shadow: 0 0 0 2px #3b82f6; }
    .select-chevron {
      position: absolute;
      right: 0.7rem;
      top: 50%;
      width: 0.9rem;
      height: 0.9rem;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }
    .date-field {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      height: 2rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.6rem;
      background: #ffffff;
      padding: 0 0.6rem;
      font-size: 0.75rem;
      color: #374151;
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
    }
    .date-field span { color: #6b7280; font-weight: 500; }
    .date-field input {
      border: 0;
      background: transparent;
      font-size: 0.75rem;
      color: #111827;
      outline: none;
    }
  `
})
export class AdminListPanel {
  readonly values = input.required<AdminFilterValues>();
  // Valores por defecto: sirven para saber si hay algo cambiado y para el botón de limpiar
  readonly defaults = input.required<AdminFilterValues>();
  // Claves que cuentan como filtro en el aviso "Tienes N filtros activos" (el orden no cuenta)
  readonly countedKeys = input<string[]>([]);
  readonly selects = input<AdminSelectDef[]>([]);
  readonly dateFields = input<AdminDateField[]>([]);
  readonly showPrice = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Buscar…');

  readonly valuesChange = output<Partial<AdminFilterValues>>();
  readonly resetFilters = output<void>();

  // Cuántos filtros hay activos. El precio cuenta como uno, aunque tenga mínimo y máximo.
  readonly activeCount = computed(() => {
    const values = this.values();
    const defaults = this.defaults();
    const count = this.countedKeys().filter(key => (values[key] ?? '') !== (defaults[key] ?? '')).length;
    const priceActive = this.showPrice() && (values['min_price'] ?? '') + (values['max_price'] ?? '') !== '';
    return count + (priceActive ? 1 : 0);
  });

  // Hay algo distinto de los valores por defecto (incluido el orden), así que el botón de limpiar tiene sentido
  readonly isDirty = computed(() => {
    const values = this.values();
    const defaults = this.defaults();
    return Object.keys(defaults).some(key => (values[key] ?? '') !== (defaults[key] ?? ''));
  });

  onSearch(text: string): void {
    this.valuesChange.emit({ search: text });
  }

  onSelect(key: string, event: Event): void {
    this.valuesChange.emit({ [key]: (event.target as HTMLSelectElement).value });
  }

  onDate(key: string, event: Event): void {
    this.valuesChange.emit({ [key]: (event.target as HTMLInputElement).value });
  }

  onPrice(range: PriceRange): void {
    this.valuesChange.emit({
      min_price: range.minPrice === null ? '' : String(range.minPrice),
      max_price: range.maxPrice === null ? '' : String(range.maxPrice)
    });
  }

  toNumber(value: string | undefined): number | null {
    return value ? Number(value) : null;
  }
}
