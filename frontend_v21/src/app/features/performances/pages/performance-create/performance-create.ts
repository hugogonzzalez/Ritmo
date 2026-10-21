import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { AlertService } from '../../../../core/services/alert.service';
import { PerformancePayload } from '../../../../core/models/performance.model';
import { PerformanceForm } from '../../components/performance-form/performance-form';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { PerformanceService } from '../../../../core/services/performance.service';
import { ConcertService } from '../../../../core/services/concert.service';
import { VenueService } from '../../../../core/services/venue.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { PerformancesStore } from '../../../../core/stores/performances.store';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { VenuesStore } from '../../../../core/stores/venues.store';

@Component({
  selector: 'app-performance-create',
  standalone: true,
  imports: [PerformanceForm, RouterLink, LucideArrowLeft, ImageManager],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/performances"><svg lucideArrowLeft [size]="16"></svg> Volver a sesiones</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE SESIONES</p><h1>Nueva sesión</h1><p class="heading-copy">Añade una fecha, una sala y un precio a un concierto.</p></div>
      </div>

      <app-performance-form
        [concerts]="concertsStore.concerts()"
        [venues]="venuesStore.venues()"
        [saving]="store.saving()"
        [error]="store.error()"
        (formSubmit)="save($event)"
        (cancelClick)="cancel()" />
        <app-image-manager #gallery ownerType="performance" />
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class PerformanceCreate implements OnInit {
  @ViewChild('gallery') gallery?: ImageManager;
  readonly store = inject(PerformancesStore);
  readonly concertsStore = inject(ConcertsStore);
  readonly venuesStore = inject(VenuesStore);
  private readonly performanceService = inject(PerformanceService);
  private readonly concertService = inject(ConcertService);
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
    void this.loadReferences();
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

  async save(payload: PerformancePayload): Promise<void> {
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.performanceService.create(payload);
      this.store.upsert(response.data);
      await this.gallery?.saveFor(response.data._id);
      await this.alerts.success('Sesión creada', response.data.city);
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
}
