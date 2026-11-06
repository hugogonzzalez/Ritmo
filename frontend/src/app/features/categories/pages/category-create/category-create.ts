import { AlertService } from '../../../../core/services/alert.service';
import { ImageService } from '../../../../core/services/image.service';
import { ImagePayload } from '../../../../core/models/image.model';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { ImageManager } from '../../../images/components/image-manager/image-manager';
import { CategoryForm } from '../../components/category-form/category-form';
import { Category, CategoryPayload } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { CategoriesStore } from '../../../../core/stores/categories.store';

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
        <app-image-manager [pendingUrls]="pendingUrls()" (urlsAdded)="addPending($event)" (pendingRemoved)="removePending($event)" />
    </section>
  `,
  styles: [`.admin-content{max-width:820px;margin:auto;padding:28px 36px 52px}.form-back{display:inline-flex;align-items:center;gap:7px;margin-bottom:20px;color:#718096;text-decoration:none;font-size:11px;font-weight:600}.form-back:hover{color:#0878f9}.admin-page-heading{margin-bottom:22px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}@media(max-width:650px){.admin-content{padding:22px 16px 38px}.admin-page-heading h1{font-size:25px}}`]
})
export class CategoryCreate implements OnInit {
  readonly store = inject(CategoriesStore);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly imageService = inject(ImageService);

  ngOnInit(): void {
    this.store.clearError();
    this.store.clearSelected();
  }

  async save(payload: CategoryPayload): Promise<void> {
    this.store.setSaving(true);
    this.store.setError(null);
    try {
      const response = await this.categoryService.create(payload);
      this.store.upsert(response.data);
      await this.uploadPending(response.data._id);
      await this.alerts.success('Categoría creada', response.data.name);
      await this.router.navigateByUrl('/categories');
    } catch (error) {
      this.store.setError(getApiErrorMessage(error, 'No se ha podido guardar la categoría.'));
    } finally {
      this.store.setSaving(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/categories');
  }

  readonly pendingUrls = signal<string[]>([]);

  addPending(urls: string[]): void {
    this.pendingUrls.update((list) => [...list, ...urls]);
  }

  removePending(index: number): void {
    this.pendingUrls.update((list) => list.filter((_, position) => position !== index));
  }

  // Sube las URLs elegidas antes de guardar, cuando la entidad ya tiene id.
  private async uploadPending(id: string): Promise<void> {
    const urls = this.pendingUrls();
    if (urls.length === 0) return;

    await this.imageService.create({ categoryId: id, urls } as ImagePayload);
    this.pendingUrls.set([]);
  }
}
