import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { VenueForm } from '../../components/venue-form/venue-form';
import { Venue, VenuePayload } from '../../../../core/models/venue.model';
import { VenueService } from '../../../../core/services/venue.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { VenuesStore } from '../../../../core/stores/venues.store';

@Component({
  selector: 'app-venue-create',
  standalone: true,
  imports: [VenueForm, ImageManager, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/venues"><svg lucideArrowLeft [size]="16"></svg> Volver a salas</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE SALAS</p><h1>Nueva sala</h1><p class="heading-copy">Añade una sala con su dirección, aforo y estado.</p></div>
      </div>

      <app-venue-form [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
      <app-image-manager #gallery ownerType="venue" />
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class VenueCreate implements OnInit {
  @ViewChild('gallery') gallery?: ImageManager;
  readonly store = inject(VenuesStore);
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
  }

  async save(payload: VenuePayload): Promise<void> {
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.venueService.create(payload);
      this.store.upsert(response.data);
      await this.gallery?.saveFor(response.data._id);
      await this.alerts.success('Sala creada', response.data.name);
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
}
