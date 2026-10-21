import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { ConcertPayload } from '../../../../core/models/concert.model';
import { ConcertForm } from '../../components/concert-form/concert-form';
import { ConcertService } from '../../../../core/services/concert.service';
import { ArtistService } from '../../../../core/services/artist.service';
import { CategoryService } from '../../../../core/services/category.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ConcertsStore } from '../../../../core/stores/concerts.store';
import { ArtistsStore } from '../../../../core/stores/artists.store';
import { CategoriesStore } from '../../../../core/stores/categories.store';

@Component({
  selector: 'app-concert-edit',
  standalone: true,
  imports: [ConcertForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/concerts"><svg lucideArrowLeft [size]="16"></svg> Volver a conciertos</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE CONCIERTOS</p><h1>Editar concierto</h1><p class="heading-copy">Actualiza la información y el estado del evento.</p></div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (!store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar el concierto.' }}<a routerLink="/concerts">Volver al listado</a></div>
      } @else {
        <app-concert-form
          [value]="store.selected()"
          [artists]="artistsStore.artists()"
          [categories]="categoriesStore.categories()"
          [saving]="store.saving()"
          [error]="store.error()"
          (formSubmit)="save($event)"
          (cancelClick)="cancel()" />
        <app-image-manager ownerType="concert" [ownerId]="store.selected()?._id ?? null" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:1040px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class ConcertEdit implements OnInit {
  readonly store = inject(ConcertsStore);
  readonly artistsStore = inject(ArtistsStore);
  readonly categoriesStore = inject(CategoriesStore);
  private readonly concertService = inject(ConcertService);
  private readonly artistService = inject(ArtistService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    void this.loadReferences();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async loadReferences(): Promise<void> {
    try {
      const [artists, categories] = await Promise.all([
        this.artistService.getAll({ includeInactive: true }),
        this.categoryService.getAll({ includeInactive: true })
      ]);
      this.artistsStore.setItems(artists.data);
      this.categoriesStore.setItems(categories.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar artistas y categorías.'));
    }
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.concertService.getById(id);
      this.store.setSelected(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado el concierto.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async save(payload: ConcertPayload): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.concertService.update(id, payload);
      this.store.upsert(response.data);
      await this.alerts.success('Concierto actualizado', response.data.title);
      await this.router.navigateByUrl('/concerts');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar el concierto.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/concerts');
  }
}
