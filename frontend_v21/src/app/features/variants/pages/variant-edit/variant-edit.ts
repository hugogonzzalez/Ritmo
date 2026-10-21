import { AlertService } from '../../../../core/services/alert.service';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { VariantForm } from '../../components/variant-form/variant-form';
import { VariantPayload } from '../../../../core/models/variant.model';
import { VariantService } from '../../../../core/services/variant.service';
import { PerformanceService } from '../../../../core/services/performance.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { VariantsStore } from '../../../../core/stores/variants.store';
import { PerformancesStore } from '../../../../core/stores/performances.store';

@Component({
  selector: 'app-variant-edit',
  standalone: true,
  imports: [VariantForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/variants"><svg lucideArrowLeft [size]="16"></svg> Volver a variantes</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE VARIANTES</p><h1>Editar variante</h1><p class="heading-copy">Actualiza el precio, las entradas o la sesión de esta variante.</p></div>
      </div>

      @if (store.loading()) {
        <app-skeleton-loader [count]="5" />
      } @else if (!store.selected()) {
        <div class="form-error-panel" role="alert">{{ store.error() || 'No se ha podido cargar la variante.' }}<a routerLink="/variants">Volver al listado</a></div>
      } @else {
        <app-variant-form [value]="store.selected()" [performances]="performancesStore.performances()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        <app-image-manager ownerType="variant" [ownerId]="store.selected()?._id ?? null" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-error-panel{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error-panel a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class VariantEdit implements OnInit {
  readonly store = inject(VariantsStore);
  readonly performancesStore = inject(PerformancesStore);
  private readonly variantService = inject(VariantService);
  private readonly performanceService = inject(PerformanceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    void this.loadPerformances();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.load(id);
  }

  async loadPerformances(): Promise<void> {
    try {
      const response = await this.performanceService.getAll({ includeInactive: true });
      this.performancesStore.setItems(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se han podido cargar las sesiones.'));
    }
  }

  async load(id: string): Promise<void> {
    this.store.setLoading(true);
    this.store.setError(null);
    this.store.setSelected(null);
    try {
      const response = await this.variantService.getById(id);
      this.store.setSelected(response.data);
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha encontrado la variante.'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async save(payload: VariantPayload): Promise<void> {
    const id = this.store.selected()?._id;
    if (!id) return;

    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.variantService.update(id, payload);
      this.store.upsert(response.data);
      await this.alerts.success('Variante actualizada', response.data.name);
      await this.router.navigateByUrl('/variants');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar la variante.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/variants');
  }
}
