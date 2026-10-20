import { Injectable, computed, inject, signal } from '@angular/core';
import { Category, CategoryPayload } from '../models/category.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { CategoryService } from '../services/category.service';

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly service = inject(CategoryService);
  private readonly _categories = signal<Category[]>([]);
  private readonly _selected = signal<Category | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = this._categories.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._categories().length);
  readonly isEmpty = computed(() => !this._loading() && this._categories().length === 0);
  readonly activeCount = computed(() => this._categories().filter(item => item.isActive).length);
  readonly inactiveCount = computed(() => this._categories().filter(item => !item.isActive).length);

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._categories.set(await this.service.listAdmin());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar las categorías.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: string): Promise<Category | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const category = await this.service.getById(id);
      this._selected.set(category);
      return category;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha encontrado la categoría.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: CategoryPayload, id?: string): Promise<Category | null> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const category = id ? await this.service.update(id, payload) : await this.service.create(payload);
      this._categories.update(list => id
        ? list.map(item => item._id === category._id ? category : item)
        : [category, ...list]);
      this._selected.set(category);
      return category;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido guardar la categoría.'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  async toggleActive(category: Category): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const updated = await this.service.setActive(category._id, !category.isActive);
      this.replace(updated);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(category: Category, onSuccess?: () => void): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      await this.service.softDelete(category._id);
      this._categories.update(list => list.filter(item => item._id !== category._id));
      if (this._selected()?._id === category._id) this._selected.set(null);
      onSuccess?.();
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo eliminar la categoría.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  clearError(): void { this._error.set(null); }
  clearSelected(): void { this._selected.set(null); }

  private replace(updated: Category): void {
    this._categories.update(list => list.map(item => item._id === updated._id ? updated : item));
    if (this._selected()?._id === updated._id) this._selected.set(updated);
  }
}
