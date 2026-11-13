import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { getApiErrorMessage } from '../../../../core/services/api-error.util';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { ShopConcert, ShopPerformance, ShopVariant } from '../../../../core/models/shop.model';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [SkeletonLoader, ErrorState, DatePipe, CurrencyPipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <button (click)="goBack()" class="mb-6 inline-flex items-center gap-2 rounded-xl border-0 bg-[#1684ff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1769bd]">
        <span aria-hidden="true">←</span> Volver a conciertos
      </button>

      @if (store.detailLoading()) {
        <app-skeleton-loader />
      } @else if (store.detailError()) {
        <app-error-state [message]="store.detailError()!" (retry)="load(slug)" />
      } @else if (store.selectedConcert(); as concert) {

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-10">

          <!-- Izquierda: imágenes + información -->
          <div class="lg:col-span-3 space-y-6">

            <!-- Galería -->
            <div class="rounded-2xl overflow-hidden bg-gray-100">
              @if (images(concert).length > 0) {
                <div class="relative h-80 sm:h-96">
                  <img [src]="images(concert)[currentImageIndex()]" [alt]="concert.title"
                       class="w-full h-full object-cover" />

                  @if (images(concert).length > 1) {
                    <button (click)="prevImage(concert)" [disabled]="currentImageIndex() === 0"
                            aria-label="Imagen anterior"
                            class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-40 hover:bg-white transition">
                      <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button (click)="nextImage(concert)" [disabled]="currentImageIndex() === images(concert).length - 1"
                            aria-label="Imagen siguiente"
                            class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center disabled:opacity-40 hover:bg-white transition">
                      <svg class="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      @for (image of images(concert); track $index) {
                        <button (click)="currentImageIndex.set($index)" aria-label="Ver imagen {{ $index + 1 }}"
                                [class]="$index === currentImageIndex() ? 'w-2 h-2 rounded-full bg-white shadow' : 'w-2 h-2 rounded-full bg-white/50'"></button>
                      }
                    </div>
                  }
                </div>

                @if (images(concert).length > 1) {
                  <div class="flex gap-2 p-3 overflow-x-auto">
                    @for (image of images(concert); track $index) {
                      <button (click)="currentImageIndex.set($index)"
                              [class]="'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ' +
                                ($index === currentImageIndex() ? 'border-blue-500' : 'border-transparent hover:border-gray-300')">
                        <img [src]="image" [alt]="concert.title" class="w-full h-full object-cover" />
                      </button>
                    }
                  </div>
                }
              } @else {
                <div class="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                  <span class="text-6xl font-bold text-blue-300">{{ concert.title.charAt(0) }}</span>
                </div>
              }
            </div>

            <!-- Información -->
            <div class="space-y-4">
              <div class="flex flex-wrap gap-2">
                @for (category of concert.categories; track category._id) {
                  <span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{{ category.name }}</span>
                }
                @if (concert.status === 'full') {
                  <span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">Completo</span>
                }
              </div>

              <h1 class="text-3xl font-bold text-gray-900 leading-tight">{{ concert.title }}</h1>

              @if (concert.artists.length) {
                <p class="text-sm text-gray-700"><span class="font-semibold">Artistas:</span> {{ artistNames(concert) }}</p>
              }

              @if (concert.description) {
                <div>
                  <h3 class="text-base font-semibold text-gray-900 mb-2">Sobre este concierto</h3>
                  <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ concert.description }}</p>
                </div>
              }

              @for (artist of concert.artists; track artist._id) {
                @if (artist.bio) {
                  <div class="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Sobre el artista</p>
                    <p class="text-sm font-medium text-blue-900">{{ artist.name }}</p>
                    <p class="text-sm text-blue-700 mt-1 leading-relaxed">{{ artist.bio }}</p>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Derecha: sesiones y entradas -->
          <div class="lg:col-span-2">
            <div class="sticky top-24 space-y-6">

              <div class="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white">
                <h2 class="text-lg font-bold text-gray-900 mb-4">Sesiones disponibles</h2>

                @if (store.performances().length) {
                  <div class="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    @for (performance of store.performances(); track performance._id) {
                      <button (click)="selectPerformance(performance)" [class]="performanceClass(performance)">
                        <div class="flex justify-between items-start gap-3">
                          <div>
                            <p class="text-sm font-semibold text-gray-900">{{ performance.startsAt | date: 'dd/MM/yyyy HH:mm' }}</p>
                            <p class="text-xs text-gray-500 mt-0.5">{{ performance.city }} · {{ performance.venue?.name ?? 'Sala por confirmar' }}</p>
                          </div>
                          <p class="text-sm font-bold text-gray-900">{{ performance.price | currency: 'EUR' : 'symbol' : '1.2-2' }}</p>
                        </div>
                      </button>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-gray-500">No hay sesiones disponibles para este concierto.</p>
                }
              </div>

              <!-- Entradas de la sesión seleccionada -->
              @if (selectedPerformance(); as performance) {
                <div class="rounded-2xl border border-gray-200 shadow-sm p-6 bg-white">
                  <h2 class="text-lg font-bold text-gray-900 mb-4">Entradas</h2>

                  @if (variantsLoading()) {
                    <div class="space-y-3">
                      @for (i of [1, 2]; track i) {
                        <div class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
                      }
                    </div>
                  } @else if (variantsError()) {
                    <p class="text-sm text-red-600">{{ variantsError() }}</p>
                  } @else if (variants().length === 0) {
                    <p class="text-sm text-gray-500">No hay entradas disponibles para esta sesión.</p>
                  } @else {
                    <div class="space-y-3">
                      @for (variant of variants(); track variant._id) {
                        <div class="rounded-xl border border-gray-200 p-4">
                          <div class="flex justify-between items-start gap-3">
                            <div>
                              <p class="font-semibold text-gray-900 text-sm">{{ variant.name }}</p>
                              @if (variant.description) {
                                <p class="text-xs text-gray-500 mt-0.5">{{ variant.description }}</p>
                              }
                              <p class="text-xs mt-1" [class]="variant.available > 0 ? 'text-gray-400' : 'text-red-600 font-medium'">
                                {{ variant.available > 0 ? 'Quedan ' + variant.available : 'Agotado' }}
                              </p>
                            </div>
                            <p class="text-base font-bold text-gray-900">{{ variant.price | currency: 'EUR' : 'symbol' : '1.2-2' }}</p>
                          </div>
                          <button disabled title="Compra próximamente"
                                  class="mt-3 w-full bg-blue-500 text-white py-2 rounded-xl text-sm font-semibold opacity-60 cursor-not-allowed">
                            Comprar (próximamente)
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ShopDetail implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected slug = '';
  protected readonly currentImageIndex = signal(0);
  protected readonly selectedPerformance = signal<ShopPerformance | null>(null);
  protected readonly variants = signal<ShopVariant[]>([]);
  protected readonly variantsLoading = signal(false);
  protected readonly variantsError = signal<string | null>(null);

  private variantsRequestId = 0;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.slug = params.get('slug') ?? '';
        if (this.slug) void this.load(this.slug);
      });
  }

  async load(slug: string): Promise<void> {
    this.store.setDetailLoading(true);
    this.store.setDetailError(null);
    this.store.setSelectedConcert(null);
    this.selectedPerformance.set(null);
    this.variants.set([]);
    this.currentImageIndex.set(0);

    try {
      const [concert, performances] = await Promise.all([
        this.shopService.getConcertBySlug(slug),
        this.shopService.getPerformancesBySlug(slug)
      ]);
      this.store.setSelectedConcert(concert.data);
      this.store.setPerformances(performances.data);

      if (performances.data.length) {
        this.selectPerformance(performances.data[0]);
      }
    } catch (error) {
      this.store.setDetailError(getApiErrorMessage(error, 'No se ha encontrado el concierto.'));
    } finally {
      this.store.setDetailLoading(false);
    }
  }

  images(concert: ShopConcert): string[] {
    return concert.images ?? [];
  }

  prevImage(concert: ShopConcert): void {
    if (this.currentImageIndex() > 0) this.currentImageIndex.update(i => i - 1);
  }

  nextImage(concert: ShopConcert): void {
    if (this.currentImageIndex() < this.images(concert).length - 1) this.currentImageIndex.update(i => i + 1);
  }

  selectPerformance(performance: ShopPerformance): void {
    this.selectedPerformance.set(performance);
    void this.loadVariants(performance.slug);
  }

  performanceClass(performance: ShopPerformance): string {
    const selected = this.selectedPerformance()?._id === performance._id;
    return 'w-full text-left rounded-xl border-2 p-4 transition-all ' +
      (selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white');
  }

  artistNames(concert: ShopConcert): string {
    return concert.artists.map(artist => artist.name).join(', ');
  }

  goBack(): void {
    void this.router.navigate(['/shop/concerts']);
  }

  private async loadVariants(performanceSlug: string): Promise<void> {
    const requestId = ++this.variantsRequestId;
    this.variantsLoading.set(true);
    this.variantsError.set(null);
    this.variants.set([]);

    try {
      const response = await this.shopService.getVariantsByPerformanceSlug(performanceSlug);
      if (requestId !== this.variantsRequestId) return;
      this.variants.set(response.data);
    } catch (error) {
      if (requestId !== this.variantsRequestId) return;
      this.variantsError.set(getApiErrorMessage(error, 'No se han podido cargar las entradas.'));
    } finally {
      if (requestId === this.variantsRequestId) this.variantsLoading.set(false);
    }
  }
}
