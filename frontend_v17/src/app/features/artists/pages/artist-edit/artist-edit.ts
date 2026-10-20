import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { ArtistPayload } from '../../../../core/models/artist.model';
import { ArtistsStore } from '../../../../core/stores/artists.store';
import { ArtistForm } from '../../components/artist-form/artist-form';

@Component({
  selector: 'app-artist-edit',
  standalone: true,
  imports: [ArtistForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/artists"><svg lucideArrowLeft [size]="16"></svg> Volver a artistas</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE ARTISTAS</p><h1>Editar artista</h1><p class="heading-copy">Actualiza el nombre, la biografía y las redes.</p></div>
      </div>

      @if (store.loading()) {
        <div class="form-card"><app-skeleton-loader [count]="5" /></div>
      } @else if (!store.selected()) {
        <div class="form-error" role="alert">{{ store.error() || 'No se ha podido cargar el artista.' }}<a routerLink="/artists">Volver al listado</a></div>
      } @else {
        <app-artist-form [value]="store.selected()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        <app-image-manager ownerType="artist" [ownerId]="store.selected()?._id ?? null" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class ArtistEdit implements OnInit {
  readonly store = inject(ArtistsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.store.loadById(id);
  }

  async save(payload: ArtistPayload): Promise<void> {
    const saved = await this.store.save(payload, this.store.selected()?._id);
    if (!saved) return;

    await this.alerts.success('Artista actualizado', saved.name);
    await this.router.navigateByUrl('/artists');
  }

  cancel(): void {
    void this.router.navigateByUrl('/artists');
  }
}
