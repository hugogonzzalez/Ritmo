import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AuthStore } from '../../../../core/stores/auth.store';

// Botón para guardar o quitar una entrada de la lista de deseos.
// Sin sesión iniciada, lleva al login y vuelve a esta página después.
@Component({
  selector: 'app-wishlist-button',
  standalone: true,
  host: { class: 'block' },
  template: `
    <button type="button" (click)="alternar()" [disabled]="ocupado()" [attr.aria-pressed]="marcada()"
            class="wish-btn inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition disabled:opacity-50"
            [class.wish-btn--activo]="marcada()">
      <span aria-hidden="true">{{ marcada() ? '♥' : '♡' }}</span>
      {{ marcada() ? 'En tu lista de deseos' : 'Guardar en lista de deseos' }}
    </button>
  `,
  styles: `
    .wish-btn { font-size: 12px; font-weight: 600; line-height: 1.2; border-color: #d1d5db; background: #fff; color: #374151; cursor: pointer; }
    .wish-btn:hover { background: #f9fafb; }
    .wish-btn--activo { border-color: #fda4af; background: #fff1f2; color: #e11d48; }
  `
})
export class WishlistButton {
  private readonly wishlist = inject(WishlistService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly variantId = input.required<string>();
  readonly ocupado = signal(false);
  readonly marcada = computed(() => this.wishlist.contiene(this.variantId()));

  async alternar(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.ocupado.set(true);
    try {
      if (this.marcada()) {
        await this.wishlist.quitar(this.variantId());
      } else {
        await this.wishlist.agregar(this.variantId());
      }
    } catch {
      // El interceptor de errores ya muestra el aviso
    } finally {
      this.ocupado.set(false);
    }
  }
}
