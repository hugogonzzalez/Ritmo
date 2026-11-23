import { Component, computed, input, output } from '@angular/core';
import { ShopArtist } from '../../../../core/models/shop.model';

@Component({
  selector: 'app-artist-card',
  standalone: true,
  template: `
    <button type="button" (click)="selected.emit(artist())"
            class="group flex h-full w-full cursor-pointer flex-col p-0 overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span class="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
        @if (imageUrl(); as src) {
          <img [src]="src" [alt]="artist().name"
               class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        } @else {
          <span class="flex h-full w-full items-center justify-center text-6xl font-bold uppercase text-blue-300">
            {{ artist().name.charAt(0) }}
          </span>
        }
      </span>

      <span class="flex flex-1 flex-col gap-1.5 p-5">
        <span class="text-lg font-semibold leading-snug text-gray-900 transition-colors group-hover:text-blue-600 line-clamp-1">
          {{ artist().name }}
        </span>
        @if (artist().bio) {
          <span class="text-sm leading-relaxed text-gray-500 line-clamp-2">{{ artist().bio }}</span>
        }
        <span class="mt-auto pt-3 text-sm font-semibold text-blue-600">Ver conciertos →</span>
      </span>
    </button>
  `
})
export class ArtistCard {
  readonly artist = input.required<ShopArtist>();
  readonly selected = output<ShopArtist>();

  // Primera imagen válida; si no hay, la tarjeta muestra la inicial del nombre
  readonly imageUrl = computed(() => this.artist().images?.find(url => !!url) ?? null);
}
