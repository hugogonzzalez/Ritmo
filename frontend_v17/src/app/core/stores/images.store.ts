import { Injectable, inject, signal } from '@angular/core';
import { ConcertImage, ImagePayload } from '../models/image.model';
import { getApiErrorMessage } from '../services/api-error.util';
import { ImageService } from '../services/image.service';

export type ImageOwnerType = 'concert' | 'performance' | 'artist' | 'category';

export interface ImageOwner {
  type: ImageOwnerType;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class ImagesStore {
  private readonly service = inject(ImageService);
  private readonly _images = signal<ConcertImage[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly images = this._images.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  async load(owner: ImageOwner): Promise<void> {
    this._images.set([]);
    this._error.set(null);
    this._loading.set(true);
    try {
      this._images.set(await this.fetch(owner));
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido cargar las imágenes.'));
    } finally {
      this._loading.set(false);
    }
  }

  async add(owner: ImageOwner, urls: string[]): Promise<boolean> {
    this._saving.set(true);
    this._error.set(null);
    try {
      await this.service.create({ ...this.ownerPayload(owner), urls } as ImagePayload);
      this._images.set(await this.fetch(owner));
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se han podido añadir las imágenes.'));
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  async remove(image: ConcertImage): Promise<boolean> {
    this._error.set(null);
    try {
      await this.service.remove(image._id);
      this._images.update((list) => list.filter((item) => item._id !== image._id));
      return true;
    } catch (error) {
      this._error.set(getApiErrorMessage(error, 'No se ha podido eliminar la imagen.'));
      return false;
    }
  }

  clearError(): void { this._error.set(null); }

  private fetch(owner: ImageOwner): Promise<ConcertImage[]> {
    switch (owner.type) {
      case 'concert': return this.service.listByConcert(owner.id);
      case 'performance': return this.service.listByPerformance(owner.id);
      case 'category': return this.service.listByCategory(owner.id);
      default: return this.service.listByArtist(owner.id);
    }
  }

  private ownerPayload(owner: ImageOwner): Partial<ImagePayload> {
    switch (owner.type) {
      case 'concert': return { concertId: owner.id };
      case 'performance': return { performanceId: owner.id };
      case 'category': return { categoryId: owner.id };
      default: return { artistId: owner.id };
    }
  }
}
