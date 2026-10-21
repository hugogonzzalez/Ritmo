import { Injectable, computed, signal } from '@angular/core';
import { Variant } from '../models/variant.model';

// Store pasiva: solo guarda estado. Las páginas llaman a los servicios y actualizan esta store.
@Injectable({ providedIn: 'root' })
export class VariantsStore {
  private readonly _variants = signal<Variant[]>([]);
  private readonly _selected = signal<Variant | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly variants = this._variants.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._variants().length);
  readonly isEmpty = computed(() => !this._loading() && this._variants().length === 0);

  setLoading(value: boolean): void { this._loading.set(value); }
  setSaving(value: boolean): void { this._saving.set(value); }
  setError(value: string | null): void { this._error.set(value); }
  setItems(items: Variant[]): void { this._variants.set(items); }
  setSelected(item: Variant | null): void { this._selected.set(item); }
  clearError(): void { this._error.set(null); }
  clearSelected(): void { this._selected.set(null); }

  // Inserta si no existe o reemplaza el registro con el mismo _id
  upsert(item: Variant): void {
    this._variants.update((list) => {
      const exists = list.some((entry) => entry._id === item._id);
      return exists ? list.map((entry) => (entry._id === item._id ? item : entry)) : [item, ...list];
    });
    if (this._selected()?._id === item._id) this._selected.set(item);
  }

  remove(id: string): void {
    this._variants.update((list) => list.filter((entry) => entry._id !== id));
    if (this._selected()?._id === id) this._selected.set(null);
  }
}
