import { Component, input, output } from '@angular/core';
import { ShopConcert } from '../../../../core/models/shop.model';

@Component({
  selector: 'app-concert-shop-card',
  standalone: true,
  template: `
    <article (click)="selected.emit(concert())"
             class="group cursor-pointer rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
      <div class="relative h-52 bg-gray-100 overflow-hidden">
        @if (concert().images[0]; as image) {
          <img [src]="image" [alt]="concert().title"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        } @else {
          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl font-bold text-blue-300">
            {{ concert().title.charAt(0) }}
          </div>
        }

        @if (concert().status === 'full') {
          <span class="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-900/80 text-white">Completo</span>
        }
        @if (concert().categories[0]; as category) {
          <span class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 text-blue-600 shadow-sm">
            {{ category.name }}
          </span>
        }
      </div>

      <div class="p-4">
        <h3 class="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {{ concert().title }}
        </h3>
        @if (concert().artists.length) {
          <p class="mt-2 text-xs text-gray-500 line-clamp-1">{{ artistNames() }}</p>
        }
      </div>
    </article>
  `
})
export class ConcertShopCard {
  readonly concert = input.required<ShopConcert>();
  readonly selected = output<ShopConcert>();

  artistNames(): string {
    return this.concert().artists.map(artist => artist.name).join(', ');
  }
}
