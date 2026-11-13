import { Component, computed, input, output } from '@angular/core';
import { ShopPagination } from '../../../core/models/shop.model';

// Paginación compartida (tienda y admin). Misma disposición de siempre: controles centrados y recuento debajo.
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (pagination().totalPages > 1) {
      <div class="flex flex-col items-center gap-3">
        <nav aria-label="Paginación" class="flex flex-wrap items-center justify-center gap-1.5">
          <button type="button" [disabled]="pagination().page <= 1" (click)="pageChange.emit(pagination().page - 1)"
                  class="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white">
            ← Anterior
          </button>

          @for (page of pages(); track $index) {
            @if (page === -1) {
              <span class="px-1.5 text-sm text-gray-400" aria-hidden="true">…</span>
            } @else {
              <button type="button" (click)="pageChange.emit(page)" [class]="pageClass(page)"
                      [attr.aria-current]="page === pagination().page ? 'page' : null"
                      [attr.aria-label]="'Página ' + page">{{ page }}</button>
            }
          }

          <button type="button" [disabled]="pagination().page >= pagination().totalPages" (click)="pageChange.emit(pagination().page + 1)"
                  class="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white">
            Siguiente →
          </button>
        </nav>

        <p class="text-center text-xs text-gray-500">
          Mostrando <span class="font-semibold text-gray-700">{{ rangeStart() }}–{{ rangeEnd() }}</span>
          de <span class="font-semibold text-gray-700">{{ pagination().total }}</span> {{ itemsLabel() }}
        </p>
      </div>
    }
  `
})
export class Pagination {
  readonly pagination = input.required<ShopPagination>();
  // Nombre de lo que se pagina, para el texto "Mostrando 1–10 de 57 conciertos"
  readonly itemsLabel = input<string>('resultados');
  readonly pageChange = output<number>();

  // Números de página con puntos suspensivos (-1) cuando hay muchas
  readonly pages = computed(() => {
    const { page, totalPages } = this.pagination();
    const range: number[] = [];
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== -1) {
        range.push(-1);
      }
    }
    return range;
  });

  readonly rangeStart = computed(() => {
    const { page, limit, total } = this.pagination();
    return total === 0 ? 0 : (page - 1) * limit + 1;
  });

  readonly rangeEnd = computed(() => {
    const { page, limit, total } = this.pagination();
    return Math.min(page * limit, total);
  });

  pageClass(page: number): string {
    const base = 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition';
    return page === this.pagination().page
      ? `${base} bg-blue-600 text-white shadow-sm`
      : `${base} border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50`;
  }
}
