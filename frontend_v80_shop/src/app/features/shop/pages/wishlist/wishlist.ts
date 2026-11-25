import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AuthStore } from '../../../../core/stores/auth.store';

// Página de la lista de deseos del cliente
@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="mx-auto max-w-5xl px-6 py-8">
      <div class="mb-6">
        <p class="text-xs font-bold uppercase tracking-widest text-[#0878f9]">Tu cuenta</p>
        <h1 class="mt-1 text-2xl font-bold text-gray-900">Lista de deseos</h1>
        <p class="mt-1 text-sm text-gray-500">Entradas que has guardado para comprar más tarde.</p>
      </div>

      @if (!auth.isAuthenticated()) {
        <div class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p class="text-sm text-gray-600">Para ver tu lista de deseos, <a routerLink="/login" class="font-semibold underline">inicia sesión</a>.</p>
        </div>
      } @else if (wishlist.items().length === 0 && wishlist.loading()) {
        <div class="space-y-3">
          @for (fila of [1, 2, 3]; track fila) {
            <div class="h-20 animate-pulse rounded-2xl bg-gray-100"></div>
          }
        </div>
      } @else if (wishlist.items().length === 0) {
        <p class="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Todavía no tienes entradas guardadas. Puedes añadirlas desde la página de cada concierto.
        </p>
      } @else {
        <ul class="space-y-3">
          @for (item of wishlist.items(); track item._id) {
            <li class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#0878f9]">
              <a [routerLink]="['/shop/concerts', item.concertSlug]" class="flex min-w-0 flex-1 items-center gap-4 text-gray-900 no-underline">
                @if (item.concertImage) {
                  <img [src]="item.concertImage" [alt]="item.concertTitle" class="h-16 w-24 shrink-0 rounded-lg object-cover" />
                } @else {
                  <span class="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">Sin foto</span>
                }
                <div class="min-w-0">
                  <p class="truncate font-semibold text-gray-900">{{ item.concertTitle }}</p>
                  <p class="text-sm text-gray-600">{{ item.variantName }} · {{ item.city }}</p>
                  <p class="text-xs text-gray-400">{{ item.startsAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </a>
              <div class="flex items-center gap-5">
                <span class="font-semibold text-gray-900">{{ item.price | currency: 'EUR' }}</span>
                <button type="button" (click)="quitar(item.variantId)" class="quitar-btn">Quitar</button>
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .quitar-btn { border: 0; background: transparent; padding: 0; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; }
    .quitar-btn:hover { text-decoration: underline; }
  `
})
export class WishlistPage {
  protected readonly auth = inject(AuthStore);
  protected readonly wishlist = inject(WishlistService);

  async quitar(variantId: string): Promise<void> {
    try {
      await this.wishlist.quitar(variantId);
    } catch {
      // El interceptor de errores ya muestra el aviso
    }
  }
}
