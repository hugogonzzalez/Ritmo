import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil, LucidePlus, LucidePower, LucideTag, LucideTrash2 } from '@lucide/angular';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { AlertService } from '../../../../core/services/alert.service';
import { Category } from '../../../../core/models/category.model';
import { CategoriesStore } from '../../../../core/stores/categories.store';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [RouterLink, ErrorState, SkeletonLoader, LucidePencil, LucidePlus, LucidePower, LucideTag, LucideTrash2],
  template: `
    <section class="admin-content">
      <div class="admin-page-heading">
        <div><p class="eyebrow">CATÁLOGO</p><h1>Categorías</h1><p class="heading-copy">Consulta y gestiona las categorías musicales de Ritmo.</p></div>
        <a class="primary-action" routerLink="/categories/create"><svg lucidePlus [size]="17"></svg> Nueva categoría</a>
      </div>
      <section class="table-panel">
        @if (store.error()) { <app-error-state [message]="store.error() ?? ''" (retry)="load()" /> }
        @if (store.loading()) {
          <div class="skeleton-rows"><app-skeleton-loader [count]="5" /></div>
        } @else if (sortedCategories().length === 0) {
          <div class="table-empty"><span class="empty-icon"><svg lucideTag [size]="23"></svg></span><strong>Aún no hay categorías</strong><p>Crea la primera categoría para empezar.</p><a class="primary-action" routerLink="/categories/create"><svg lucidePlus [size]="16"></svg> Crear categoría</a></div>
        } @else {
          <div class="table-scroll"><table class="category-table">
            <thead><tr><th>Categoría</th><th>Descripción</th><th>Activo</th><th>Acciones</th></tr></thead>
            <tbody>@for (category of sortedCategories(); track category._id) {
              <tr [class.inactive-row]="!category.isActive">
                <td><div class="category-cell">
                  @if (category.images.length > 0) {
                    <img class="category-thumb" [src]="category.images[0]" [alt]="category.name">
                  } @else {
                    <span class="category-avatar"><svg lucideTag [size]="17"></svg></span>
                  }
                  <span><strong>{{ category.name }}</strong><small>{{ category.slug }}</small></span>
                </div></td>
                <td><span class="category-desc" [title]="category.description">{{ category.description || '—' }}</span></td>
                <td><span class="active-pill" [class.inactive]="!category.isActive"><i></i>{{ category.isActive ? 'Activa' : 'Inactiva' }}</span></td>
                <td><div class="row-actions">
                  <a class="icon-action" [routerLink]="['/categories', category._id, 'edit']" [attr.aria-label]="'Editar ' + category.name" title="Editar"><svg lucidePencil [size]="15"></svg></a>
                  <button class="icon-action power-action" [class.power-off]="category.isActive" (click)="toggle(category)" [disabled]="store.saving()" [attr.aria-label]="category.isActive ? 'Desactivar ' + category.name : 'Activar ' + category.name" [title]="category.isActive ? 'Desactivar' : 'Activar'"><svg lucidePower [size]="15"></svg></button>
                  <button class="icon-action delete-action" (click)="remove(category)" [disabled]="store.saving()" [attr.aria-label]="'Eliminar ' + category.name" title="Eliminar"><svg lucideTrash2 [size]="15"></svg></button>
                </div></td>
              </tr>
            }</tbody>
          </table></div>
          <div class="table-foot">{{ store.total() }} categorías <span>Los borrados lógicamente quedan fuera de la tabla.</span></div>
        }
      </section>
    </section>
  `,
  styles: [`.admin-content{max-width:1200px;margin:auto;padding:31px 36px 48px}.admin-page-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:21px}.eyebrow{margin:0 0 7px;color:#0878f9;font-size:10px;font-weight:800;letter-spacing:1.5px}.admin-page-heading h1{margin:0;font:700 29px 'Space Grotesk',sans-serif;letter-spacing:-1px}.heading-copy{margin:6px 0 0;color:#758093;font-size:13px}.primary-action{display:flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;background:#0878f9;padding:11px 15px;color:white;text-decoration:none;font-size:12px;font-weight:700;box-shadow:0 6px 15px #0878f926}.primary-action:hover{background:#0669dc}.table-panel{border:1px solid #e5e9ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 3px 10px #18223206}.table-scroll{overflow:auto}.category-table{width:100%;min-width:720px;border-collapse:collapse;text-align:left}.category-table th{height:41px;background:#f8fafc;color:#748094;font-size:10px;font-weight:700;white-space:nowrap}.category-table th,.category-table td{padding:0 14px}.category-table tbody tr{height:63px;border-top:1px solid #edf0f4}.category-table tbody tr:hover{background:#fbfcfe}.category-table tbody tr.inactive-row{background:#f1f3f6}.category-table td{color:#4b5668;font-size:11px}.category-cell{display:flex;align-items:center;gap:10px;min-width:180px}.category-avatar,.category-thumb{display:grid;place-items:center;width:35px;height:35px;flex:0 0 35px;border-radius:10px;background:#eaf3ff;color:#0878f9;object-fit:cover}.category-cell>span:last-child{display:grid;gap:4px}.category-cell strong{color:#293345;font-size:11px}.category-cell small{color:#9aa3b1;font-size:9px}.category-desc{display:block;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#7c8798;font-size:11px}.active-pill{display:inline-flex;align-items:center;gap:6px;color:#277b4c;font-size:10px;font-weight:600;white-space:nowrap}.active-pill i{width:7px;height:7px;border-radius:50%;background:#32aa68}.active-pill.inactive{color:#778195}.active-pill.inactive i{background:#aab2bf}.row-actions{display:flex;gap:5px}.icon-action{width:29px;height:29px;display:grid;place-items:center;border:1px solid #e3e8ee;border-radius:7px;background:white;color:#647084;cursor:pointer;transition:.15s}.icon-action:hover{border-color:#a5cafa;background:#f2f8ff;color:#0878f9}.icon-action.power-off{color:#b87517}.icon-action.delete-action{color:#b54e52}.icon-action.delete-action:hover{border-color:#ffc4c4;background:#fff3f3;color:#ce3339}.icon-action:disabled{opacity:.45;cursor:wait}.table-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 17px;border-top:1px solid #edf0f4;color:#8892a2;font-size:10px}.table-foot span{color:#9ca5b1}.skeleton-rows{padding:16px}.table-empty{min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.empty-icon{width:48px;height:48px;margin-bottom:12px;display:grid;place-items:center;border-radius:15px;background:#eff6ff;color:#0878f9}.table-empty strong{font:700 15px 'Space Grotesk',sans-serif;color:#30394a}.table-empty p{margin:7px 0 16px;color:#8993a2;font-size:11px}@media(max-width:850px){.admin-content{padding:25px 18px 40px}}@media(max-width:520px){.admin-page-heading{align-items:flex-start;gap:9px}.admin-page-heading h1{font-size:25px}.primary-action{padding:10px;font-size:10px}}`]
})
export class CategoriesAdmin implements OnInit {
  readonly store = inject(CategoriesStore);
  private readonly alerts = inject(AlertService);
  readonly sortedCategories = computed(() => [...this.store.categories()].sort((a, b) => a.name.localeCompare(b.name)));

  ngOnInit(): void { void this.load(); }
  load(): Promise<void> { return this.store.loadAll(); }

  async toggle(category: Category): Promise<void> {
    const active = !category.isActive;
    const changed = await this.store.toggleActive(category);
    if (changed) await this.alerts.success(active ? 'Categoría activada' : 'Categoría desactivada', category.name);
  }

  async remove(category: Category): Promise<void> {
    const confirmation = await this.alerts.confirm('¿Eliminar categoría?', `«${category.name}» desaparecerá de la tabla.`, 'Eliminar');
    if (!confirmation.isConfirmed) return;
    if (await this.store.remove(category)) await this.alerts.success('Categoría eliminada', 'Se ha eliminado de la lista de administración.');
  }
}
