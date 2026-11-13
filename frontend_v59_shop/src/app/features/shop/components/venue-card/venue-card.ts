import { Component, computed, input, output } from '@angular/core';
import { ShopVenue } from '../../../../core/models/shop.model';

@Component({
  selector: 'app-venue-card',
  standalone: true,
  template: `
    <button type="button" (click)="selected.emit(venue())"
            class="group flex h-full w-full cursor-pointer flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span class="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
        @if (imageUrl(); as src) {
          <img [src]="src" [alt]="venue().name"
               class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        } @else {
          <span class="flex h-full w-full items-center justify-center">
            <svg class="h-14 w-14 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        }
      </span>

      <span class="flex flex-1 flex-col gap-1.5 p-5">
        <span class="text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-700 line-clamp-1">
          {{ venue().name }}
        </span>
        <span class="text-sm text-gray-500 line-clamp-1">{{ venue().city }}</span>
        <span class="mt-auto pt-3 text-sm font-semibold text-blue-600">Ver conciertos →</span>
      </span>
    </button>
  `
})
export class VenueCard {
  readonly venue = input.required<ShopVenue>();
  readonly selected = output<ShopVenue>();

  // Acepta URLs sueltas o objetos { url }; si no hay ninguna, muestra el icono de respaldo
  readonly imageUrl = computed(() => {
    for (const image of this.venue().images ?? []) {
      const url = typeof image === 'string' ? image : image?.url;
      if (url) return url;
    }
    return null;
  });
}
