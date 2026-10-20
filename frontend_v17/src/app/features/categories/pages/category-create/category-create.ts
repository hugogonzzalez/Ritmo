import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoryPayload } from '../../../../core/models/category.model';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CategoryForm, RouterLink, LucideArrowLeft, ImageManager],
  template: `
    <section class="admin-content">
      <a class="form-back" routerLink="/categories"><svg lucideArrowLeft [size]="16"></svg> Volver a categorías</a>
      <div class="admin-page-heading">
        <div><p class="eyebrow">GESTIÓN DE CATEGORÍAS</p><h1>Nueva categoría</h1><p class="heading-copy">Completa los datos para añadir una categoría al catálogo.</p></div>
      </div>

      <app-category-form [saving]="store.saving()" [error]="store.error()" (formSubmit)="save($event)" (cancelClick)="cancel()" />
        <app-image-manager ownerType="category" />
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class CategoryCreate implements OnInit {
  readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
  }

  async save(payload: CategoryPayload): Promise<void> {
    const saved = await this.store.save(payload);
    if (!saved) return;

    await this.alerts.success('Categoría creada', saved.name);
    await this.router.navigateByUrl('/categories');
  }

  cancel(): void {
    void this.router.navigateByUrl('/categories');
  }
}
