import { Injectable, computed, signal } from '@angular/core';
import { ConcertImage } from '../models/image.model';

export type ImageOwnerType = 'concert' | 'performance' | 'artist' | 'category' | 'venue' | 'variant';

// Store pasiva de la galería: solo guarda las imágenes del dueño actual.
@Injectable({ providedIn: 'root' })
export class ImagesStore {
  private readonly _images = signal<ConcertImage[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly images = this._images.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._images().length);

  setLoading(value: boolean): void { this._loading.set(value); }
  setSaving(value: boolean): void { this._saving.set(value); }
  setError(value: string | null): void { this._error.set(value); }
  setItems(items: ConcertImage[]): void { this._images.set(items); }
  clearError(): void { this._error.set(null); }

  remove(id: string): void {
    this._images.update((list) => list.filter((image) => image._id !== id));
  }
}
