import { Injectable, computed, inject, signal } from '@angular/core';
import { Performance, PerformancePayload } from '../models/performance.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { PerformanceService } from '../services/performance.service';

@Injectable({ providedIn: 'root' })
export class PerformancesStore {
  private readonly service = inject(PerformanceService);
  private readonly _items = signal<Performance[]>([]);
  private readonly _selected = signal<Performance | null>(null);
  private readonly _loading = signal(false);
  private readonly _submitting = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._items.set(await this.service.listAdmin());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar las sesiones.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: string): Promise<Performance | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const performance = await this.service.getById(id);
      this._selected.set(performance);
      return performance;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar los datos de la sesión.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: PerformancePayload, id?: string): Promise<Performance | null> {
    this._submitting.set(true);
    this._error.set(null);
    try {
      const performance = id ? await this.service.update(id, payload) : await this.service.create(payload);
      this._items.update((list) => id
        ? list.map((item) => item._id === performance._id ? performance : item)
        : [performance, ...list]);
      this._selected.set(performance);
      return performance;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido guardar la sesión.'));
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

  async toggleActive(performance: Performance): Promise<boolean> {
    this._submitting.set(true);
    this._error.set(null);
    try {
      const updated = await this.service.setActive(performance._id, !performance.isActive);
      this.replace(updated);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado de la sesión.'));
      return false;
    } finally {
      this._submitting.set(false);
    }
  }

  async remove(performance: Performance): Promise<boolean> {
    this._submitting.set(true);
    this._error.set(null);
    try {
      await this.service.softDelete(performance._id);
      this._items.update((list) => list.filter((item) => item._id !== performance._id));
      if (this._selected()?._id === performance._id) this._selected.set(null);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo eliminar la sesión.'));
      return false;
    } finally {
      this._submitting.set(false);
    }
  }

  clearError(): void { this._error.set(null); }
  clearSelected(): void { this._selected.set(null); }

  private replace(updated: Performance): void {
    this._items.update((list) => list.map((item) => item._id === updated._id ? updated : item));
    if (this._selected()?._id === updated._id) this._selected.set(updated);
  }
}
