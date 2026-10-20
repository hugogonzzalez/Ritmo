import { Injectable, computed, inject, signal } from '@angular/core';
import { Venue, VenuePayload, VenueStatus } from '../models/venue.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { VenueService } from '../services/venue.service';

@Injectable({ providedIn: 'root' })
export class VenuesStore {
  private readonly service = inject(VenueService);
  private readonly _venues = signal<Venue[]>([]);
  private readonly _selected = signal<Venue | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly venues = this._venues.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._venues().length);
  readonly activeVenues = computed(() => this._venues().filter((venue) => venue.isActive));

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._venues.set(await this.service.listAdmin());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar las salas.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: string): Promise<Venue | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const venue = await this.service.getById(id);
      this._selected.set(venue);
      return venue;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha encontrado la sala.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: VenuePayload, id?: string): Promise<Venue | null> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const venue = id ? await this.service.update(id, payload) : await this.service.create(payload);
      this._venues.update((list) => id
        ? list.map((item) => item._id === venue._id ? venue : item)
        : [venue, ...list]);
      this._selected.set(venue);
      return venue;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido guardar la sala.'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  async changeStatus(venue: Venue, status: VenueStatus): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      this.replace(await this.service.changeStatus(venue._id, status));
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado de la sala.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async toggleActive(venue: Venue): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      this.replace(await this.service.setActive(venue._id, !venue.isActive));
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(venue: Venue, onSuccess?: () => void): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      await this.service.softDelete(venue._id);
      this._venues.update((list) => list.filter((item) => item._id !== venue._id));
      if (this._selected()?._id === venue._id) this._selected.set(null);
      onSuccess?.();
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo eliminar la sala.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  clearError(): void { this._error.set(null); }
  clearSelected(): void { this._selected.set(null); }

  private replace(updated: Venue): void {
    this._venues.update((list) => list.map((item) => item._id === updated._id ? updated : item));
    if (this._selected()?._id === updated._id) this._selected.set(updated);
  }
}
