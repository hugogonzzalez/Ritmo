import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoryPayload } from '../../../../core/models/category.model';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [CategoryForm, ImageManager, SkeletonLoader, RouterLink, LucideArrowLeft],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/categories"><svg lucideArrowLeft [size]="16"></svg> Volver a categorías</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE CATEGORÍAS</p><h1>Editar categoría</h1><p class="heading-copy">Actualiza el nombre, la descripción y las imágenes.</p></div>
      </div>

      @if (store.loading()) {
        <div class="form-card"><app-skeleton-loader [count]="4" /></div>
      } @else if (!store.selected()) {
        <div class="form-error" role="alert">{{ store.error() || 'No se ha podido cargar la categoría.' }}<a routerLink="/categories">Volver al listado</a></div>
      } @else {
        <app-category-form [value]="store.selected()" [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        <app-image-manager ownerType="category" [ownerId]="store.selected()?._id ?? null" />
      }
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.form-card{padding:24px 27px;border:1px solid #e6eaf0;border-radius:14px;background:#fff}.form-error{margin-bottom:16px;padding:12px 14px;border:1px solid #f3c4c4;border-radius:8px;background:#fff4f4;color:#a53c3c;font-size:11px}.form-error a{display:block;margin-top:9px;color:#0878f9;font-weight:700;text-decoration:none}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class CategoryEdit implements OnInit {
  readonly store = inject(CategoriesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) void this.store.loadById(id);
  }

  async save(payload: CategoryPayload): Promise<void> {
    const saved = await this.store.save(payload, this.store.selected()?._id);
    if (!saved) return;

    await this.alerts.success('Categoría actualizada', saved.name);
    await this.router.navigateByUrl('/categories');
  }

  cancel(): void {
    void this.router.navigateByUrl('/categories');
  }
}
