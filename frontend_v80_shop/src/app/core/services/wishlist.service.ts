import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiResponse } from '../models/api.model';
import { WishlistItem } from '../models/wishlist.model';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';

// Lista de deseos del cliente. Se carga al iniciar sesión y se vacía al cerrarla.
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);

  readonly items = signal<WishlistItem[]>([]);
  readonly loading = signal(false);
  readonly variantIds = computed(() => new Set(this.items().map((item) => item.variantId)));

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        untracked(() => void this.cargar());
      } else {
        this.items.set([]);
      }
    });
  }

  contiene(variantId: string): boolean {
    return this.variantIds().has(variantId);
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    try {
      const respuesta = await this.api.get<ApiResponse<WishlistItem[]>>('wishlist');
      this.items.set(respuesta.data);
    } catch {
      // Sin lista no se pueden marcar las entradas; el interceptor de errores ya avisa
    } finally {
      this.loading.set(false);
    }
  }

  async agregar(variantId: string): Promise<void> {
    await this.api.post<ApiResponse<unknown>>(`wishlist/variant/${variantId}`, {});
    await this.cargar();
  }

  async quitar(variantId: string): Promise<void> {
    await this.api.delete<ApiResponse<unknown>>(`wishlist/variant/${variantId}`);
    await this.cargar();
  }
}
