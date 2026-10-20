import { Injectable, computed, signal } from '@angular/core';
import { Performance } from '../models/performance.model';

@Injectable({ providedIn: 'root' })
export class PerformancesStore {
  private readonly _items = signal<Performance[]>([]);
  private readonly _loading = signal(false);
  private readonly _submitting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setSubmitting(value: boolean): void {
    this._submitting.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setItems(items: Performance[]): void {
    this._items.set(items);
  }

  upsert(item: Performance): void {
    this._items.update((current) => {
      const index = current.findIndex((entry) => entry._id === item._id);
      if (index === -1) return [item, ...current];
      const next = [...current];
      next[index] = item;
      return next;
    });
  }

  remove(id: string): void {
    this._items.update((current) => current.filter((entry) => entry._id !== id));
  }
}
