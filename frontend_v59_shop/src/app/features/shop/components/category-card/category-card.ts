import { Component, computed, input, output } from '@angular/core';
import { ShopCategory } from '../../../../core/models/shop.model';

@Component({
  selector: 'app-category-card',
  standalone: true,
  template: `
    <button type="button" (click)="selected.emit(category())"
            class="group flex h-full w-full cursor-pointer flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span class="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
        @if (imageUrl(); as src) {
          <img [src]="src" [alt]="category().name"
               class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        } @else {
          <span class="flex h-full w-full items-center justify-center">
            <svg class="h-14 w-14 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </span>
        }
      </span>

      <span class="flex flex-1 flex-col gap-1.5 p-5">
        <span class="text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-600 line-clamp-1">
          {{ category().name }}
        </span>
        @if (category().description) {
          <span class="text-sm leading-relaxed text-gray-500 line-clamp-2">{{ category().description }}</span>
        }
        <span class="mt-auto pt-3 text-sm font-semibold text-blue-600">Ver conciertos →</span>
      </span>
    </button>
  `
})
export class CategoryCard {
  readonly category = input.required<ShopCategory>();
  readonly selected = output<ShopCategory>();

  // Primera imagen válida; si no hay, la tarjeta muestra el icono de respaldo
  readonly imageUrl = computed(() => this.category().images?.find(url => !!url) ?? null);
}
