import { Injectable, computed, inject, signal } from '@angular/core';
import { Artist, ArtistPayload } from '../models/artist.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { ArtistService } from '../services/artist.service';

@Injectable({ providedIn: 'root' })
export class ArtistsStore {
  private readonly service = inject(ArtistService);
  private readonly _artists = signal<Artist[]>([]);
  private readonly _selected = signal<Artist | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly artists = this._artists.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly total = computed(() => this._artists().length);
  readonly isEmpty = computed(() => !this._loading() && this._artists().length === 0);

  async loadAll(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      this._artists.set(await this.service.listAdmin());
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar los artistas.'));
    } finally {
      this._loading.set(false);
    }
  }

  async loadById(id: string): Promise<Artist | null> {
    this._loading.set(true);
    this._error.set(null);
    this._selected.set(null);
    try {
      const artist = await this.service.getById(id);
      this._selected.set(artist);
      return artist;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar los datos del artista.'));
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async save(payload: ArtistPayload, id?: string): Promise<Artist | null> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const artist = id ? await this.service.update(id, payload) : await this.service.create(payload);
      this._artists.update(list => id
        ? list.map(item => item._id === artist._id ? artist : item)
        : [artist, ...list]);
      this._selected.set(artist);
      return artist;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido guardar el artista.'));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  async toggleActive(artist: Artist): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      const updated = await this.service.setActive(artist._id, !artist.isActive);
      this.replace(updated);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo cambiar el estado activo.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(artist: Artist): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      await this.service.softDelete(artist._id);
      this._artists.update(list => list.filter(item => item._id !== artist._id));
      if (this._selected()?._id === artist._id) this._selected.set(null);
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se pudo eliminar el artista.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  clearError(): void { this._error.set(null); }

  private replace(updated: Artist): void {
    this._artists.update(list => list.map(item => item._id === updated._id ? updated : item));
    if (this._selected()?._id === updated._id) this._selected.set(updated);
  }
}
