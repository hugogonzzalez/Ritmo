import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { ImageService } from '../../../../core/services/image.service';
import { ImagesStore } from '../../../../core/stores/images.store';
import { ConcertImage, ImagePayload } from '../../../../core/models/image.model';
import { PerformancePayload } from '../../../../core/models/performance.model';
import { PerformanceForm } from '../../components/performance-form/performance-form';
import { PerformanceService } from '../../../../core/services/performance.service';
import { ConcertService } from '../../../../core/services/concert.service';
import { VenueService } from '../../../../core/services/venue.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { PerformancesStore } from '../../../../core/stores/performances.store';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { VenuesStore } from '../../../../core/stores/venues.store';

@Component({
  selector: 'app-performance-edit',
  standalone: true,
  imports: [PerformanceForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/performances"><svg lucideArrowLeft [size]="16"></svg> Volver a sesiones</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE SESIONES</p><h1>Editar sesión</h1><p class="heading-copy">Actualiza la fecha, la sala, la ciudad y el precio.</p></div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (!store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar la sesión.' }}<a routerLink="/performances">Volver al listado</a></div>
      } @else {
        <app-performance-form
          [value]="store.selected()"
          [concerts]="concertsStore.concerts()"
          [venues]="venuesStore.venues()"
          [saving]="store.saving()"
          [error]="store.error()"
          (formSubmit)="save($event)"
          (cancelClick)="cancel()" />
        <app-image-manager [ownerId]="store.selected()?._id ?? null" [images]="imagesStore.images()" [loading]="imagesStore.loading()" [saving]="imagesStore.saving()" [error]="imagesStore.error()" (urlsAdded)="addImages($event)" (imageRemoved)="removeImage($event)" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class PerformanceEdit implements OnInit {
  readonly store = inject(PerformancesStore);
  readonly concertsStore = inject(ConcertsStore);
  readonly venuesStore = inject(VenuesStore);
  private readonly performanceService = inject(PerformanceService);
  private readonly concertService = inject(ConcertService);
  private readonly venueService = inject(VenueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  readonly imagesStore = inject(ImagesStore);
  private readonly imageService = inject(ImageService);

  ngOnInit(): void {
    this.store.clearError();
    void this.loadReferences();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async loadReferences(): Promise<void> {
    try {
      const [concerts, venues] = await Promise.all([
        this.concertService.getAll({ includeInactive: true }),
        this.venueService.getAll({ includeInactive: true })
      ]);
      this.concertsStore.setItems(concerts.data);
      this.venuesStore.setItems(venues.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar conciertos y salas.'));
    }
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.performanceService.getById(id);
      this.store.setSelected(response.data);
      await this.loadImages(response.data._id);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado la sesión.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async save(payload: PerformancePayload): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.performanceService.update(id, payload);
      this.store.upsert(response.data);
      await this.alerts.success('Sesión actualizada', response.data.city);
      await this.router.navigateByUrl('/performances');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar la sesión.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/performances');
  }

  async loadImages(id: string): Promise<void> {
    this.imagesStore.setLoading(true);
    this.imagesStore.setError(null);
    this.imagesStore.setItems([]);
    try {
      const response = await this.imageService.getAll({ performanceId: id });
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
      await this.imageService.create({ performanceId: id, urls } as ImagePayload);
      const response = await this.imageService.getAll({ performanceId: id });
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
