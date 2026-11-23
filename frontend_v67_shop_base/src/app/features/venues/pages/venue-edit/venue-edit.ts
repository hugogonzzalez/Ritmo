import { AlertService } from '../../../../core/services/alert.service';
import { ImageService } from '../../../../core/services/image.service';
import { ImagesStore } from '../../../../core/stores/images.store';
import { ConcertImage, ImagePayload } from '../../../../core/models/image.model';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { VenueForm } from '../../components/venue-form/venue-form';
import { Venue, VenuePayload } from '../../../../core/models/venue.model';
import { VenueService } from '../../../../core/services/venue.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { VenuesStore } from '../../../../core/stores/venues.store';

@Component({
  selector: 'app-venue-edit',
  standalone: true,
  imports: [VenueForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/venues"><svg lucideArrowLeft [size]="16"></svg> Volver a salas</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE SALAS</p><h1>Editar sala</h1><p class="heading-copy">Actualiza los datos, el aforo y el estado de la sala.</p></div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (!store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar la sala.' }}<a routerLink="/venues">Volver al listado</a></div>
      } @else {
        <app-venue-form [value]="store.selected()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        <app-image-manager [ownerId]="store.selected()?._id ?? null" [images]="imagesStore.images()" [loading]="imagesStore.loading()" [saving]="imagesStore.saving()" [error]="imagesStore.error()" (urlsAdded)="addImages($event)" (imageRemoved)="removeImage($event)" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class VenueEdit implements OnInit {
  readonly store = inject(VenuesStore);
  private readonly venueService = inject(VenueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  readonly imagesStore = inject(ImagesStore);
  private readonly imageService = inject(ImageService);

  ngOnInit(): void {
    this.store.clearError();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.venueService.getById(id);
      this.store.setSelected(response.data);
      await this.loadImages(response.data._id);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado la sala.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async save(payload: VenuePayload): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.venueService.update(id, payload);
      this.store.upsert(response.data);
      await this.alerts.success('Sala actualizada', response.data.name);
      await this.router.navigateByUrl('/venues');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar la sala.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/venues');
  }

  async loadImages(id: string): Promise<void> {
    this.imagesStore.setLoading(true);
    this.imagesStore.setError(null);
    this.imagesStore.setItems([]);
    try {
      const response = await this.imageService.getAll({ venueId: id });
      this.imagesStore.setItems(response.data);
    } catch (error) {
      this.imagesStore.setError(getApiErrorMessage(error, 'No se han podido cargar las imágenes.'));
    } finally {
      this.imagesStore.setLoading(false);
    }
  }

  async addImages(urls: string[]): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.imagesStore.setSaving(true);
    this.imagesStore.setError(null);
    try {
      await this.imageService.create({ venueId: id, urls } as ImagePayload);
      const response = await this.imageService.getAll({ venueId: id });
      this.imagesStore.setItems(response.data);
    } catch (error) {
      this.imagesStore.setError(getApiErrorMessage(error, 'No se han podido añadir las imágenes.'));
    } finally {
      this.imagesStore.setSaving(false);
    }
  }

  async removeImage(image: ConcertImage): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar imagen?', 'La imagen dejará de mostrarse.', 'Eliminar');
    if (!confirmation.isConfirmed) return;

    this.imagesStore.setSaving(true);
    this.imagesStore.setError(null);
    try {
      await this.imageService.softDelete(image._id);
      this.imagesStore.remove(image._id);
    } catch (error) {
      this.imagesStore.setError(getApiErrorMessage(error, 'No se ha podido eliminar la imagen.'));
    } finally {
      this.imagesStore.setSaving(false);
    }
  }
}
