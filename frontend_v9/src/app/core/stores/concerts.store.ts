import { Injectable, computed, inject, signal } from '@angular/core';
import { Concert, ConcertPayload, ConcertDraft } from '../models/concert.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { ConcertService } from '../services/concert.service';

@Injectable({ providedIn: 'root' })
export class ConcertsStore {
  private readonly service = inject(ConcertService);
  private readonly _concerts = signal<Concert[]>([]);
  private readonly _selected = signal<Concert | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _deletingId = signal<string | null>(null);
  private readonly _error = signal<string | null>(null);

  readonly concerts = this._concerts.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly deletingId = this._deletingId.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._concerts().length);
  readonly count = this.total;
  readonly isEmpty = computed(() => !this._loading() && this._concerts().length === 0);
  readonly activeCount = computed(() => this._concerts().filter(item => item.isActive).length);
  readonly inactiveCount = computed(() => this._concerts().filter(item => !item.isActive).length);
  readonly upcomingCount = computed(() => this._concerts().filter(item => item.status === 'scheduled').length);

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._concerts.set(await this.service.listAdmin());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar los conciertos.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadPublic(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._concerts.set(await this.service.list());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar los conciertos.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: string): Promise<Concert | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const concert = await this.service.getById(id);
      this._selected.set(concert);
      return concert;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha encontrado el concierto.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async loadBySlug(slug: string): Promise<Concert | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const concerts = await this.service.listAdmin();
      this._concerts.set(concerts);
      const concert = concerts.find(item => item.slug === slug) ?? null;
      if (!concert) this._error.set('No se ha encontrado el concierto o ya está eliminado.');
      this._selected.set(concert);
      return concert;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha encontrado el concierto.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: ConcertPayload, id?: string): Promise<Concert | null> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const concert = id ? await this.service.update(id, payload) : await this.service.create(payload);
      this._concerts.update(list => id
        ? list.map(item => item._id === concert._id ? concert : item)
        : [concert, ...list]);
      this._selected.set(concert);
      return concert;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido guardar el concierto.'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  async create(payload: ConcertDraft, onSuccess?: (concert: Concert) => void): Promise<void> {
    const concert = await this.save({
      ...payload,
      status: payload.status ?? 'scheduled',
      isActive: payload.isActive ?? true
    });
    if (concert) onSuccess?.(concert);
  }

  async update(id: string, payload: ConcertDraft, onSuccess?: (concert: Concert) => void): Promise<void> {
    const concert = await this.save({
      ...payload,
      status: payload.status ?? this._selected()?.status ?? 'scheduled',
      isActive: payload.isActive ?? this._selected()?.isActive ?? true
    }, id);
    if (concert) onSuccess?.(concert);
  }

  async toggleActive(concert: Concert): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const updated = await this.service.setActive(concert._id, !concert.isActive);
      this.replace(updated);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(concert: Concert, onSuccess?: () => void): Promise<boolean> {
    this._saving.set(true);
    this._deletingId.set(concert._id);
    this._error.set(null);
    try {
      await this.service.softDelete(concert._id);
      this._concerts.update(list => list.filter(item => item._id !== concert._id));
      if (this._selected()?._id === concert._id) this._selected.set(null);
      onSuccess?.();
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo eliminar el concierto.'));
      return false;
    } finally {
      this._saving.set(false);
      this._deletingId.set(null);
    }
  }

  clearError(): void { this._error.set(null); }
  clearSelected(): void { this._selected.set(null); }

  private replace(updated: Concert): void {
    this._concerts.update(list => list.map(item => item._id === updated._id ? updated : item));
    if (this._selected()?._id === updated._id) this._selected.set(updated);
  }
}
